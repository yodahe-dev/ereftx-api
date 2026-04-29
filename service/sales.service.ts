import db from "../models";
import { HistoryActionType } from "../models/StockHistory";
import type { Transaction } from "sequelize";

// Import model classes (default exports) to create instance types
import ProductModel from "../models/Product";
import ProductPriceModel from "../models/ProductPricing";
import StockModel from "../models/Stock";
import SaleItemModel from "../models/SaleItems";

// Convenience type aliases
type Product = InstanceType<ReturnType<typeof ProductModel>>;
type ProductPrice = InstanceType<ReturnType<typeof ProductPriceModel>>;
type Stock = InstanceType<ReturnType<typeof StockModel>>;
type SaleItem = InstanceType<ReturnType<typeof SaleItemModel>>;

// ---------- Input types (unchanged) ----------
type CreateSaleInput = {
  customerName: string;
  description?: string | null;
  paymentType: "cash" | "credit";
  paymentStatus?: "paid" | "pending";
  items: {
    productId: string;
    quantity: number;
    unitType: "box" | "single";
    customUnitPrice?: number;
  }[];
};

type UpdateSaleInput = {
  customerName?: string;
  description?: string | null;
  paymentType?: "cash" | "credit";
  paymentStatus?: "paid" | "pending";
  items?: {
    productId: string;
    quantity: number;
    unitType: "box" | "single";
    customUnitPrice?: number;
  }[];
};

// ---------- Helper return type ----------
interface ProcessedItem {
  unitPrice: number;
  costPrice: number;
  totalPrice: number;
  totalItemCost: number;
  productName: string;
  totalUnits: number;
  priceId: string;
}

// ---------- Core helper ----------
async function processSaleItem(
  saleId: string,
  item: {
    productId: string;
    quantity: number;
    unitType: "box" | "single";
    customUnitPrice?: number;
  },
  t: Transaction,
  isAdding: boolean
): Promise<ProcessedItem> {
  const product = (await db.Product.findByPk(item.productId, { transaction: t })) as Product | null;
  if (!product) throw new Error("Product not found");

  const price = (await db.ProductPrice.findOne({
    where: { productId: item.productId, endAt: null },
    transaction: t,
  })) as ProductPrice | null;
  if (!price) throw new Error("Price not found");

  const stock = (await db.Stock.findOne({
    where: { productId: item.productId },
    transaction: t,
    lock: t.LOCK.UPDATE,
  })) as Stock | null;
  if (!stock) throw new Error("Stock not found");

  const beforeBox = stock.boxQuantity;
  const beforeSingle = stock.singleQuantity;

  if (isAdding) {
    // Deduct stock
    const totalUnits = item.unitType === "box"
      ? item.quantity * product.unitsPerBox
      : item.quantity;

    if (item.unitType === "box") {
      if (stock.boxQuantity < item.quantity)
        throw new Error(`Not enough boxes of ${product.name}`);
      stock.boxQuantity -= item.quantity;
    } else {
      // Singles with possible box‑breaking
      if (stock.singleQuantity < item.quantity) {
        const neededSingles = item.quantity - stock.singleQuantity;
        const boxesToBreak = Math.ceil(neededSingles / product.unitsPerBox);
        if (stock.boxQuantity < boxesToBreak)
          throw new Error(
            `Not enough singles of ${product.name} (even after breaking boxes)`
          );
        stock.boxQuantity -= boxesToBreak;
        stock.singleQuantity += boxesToBreak * product.unitsPerBox;
      }
      stock.singleQuantity -= item.quantity;
    }

    await stock.save({ transaction: t });

    await db.StockHistory.create(
      {
        productId: product.id,
        actionType: HistoryActionType.SALE,
        boxQuantityBefore: beforeBox,
        singleQuantityBefore: beforeSingle,
        boxQuantityAfter: stock.boxQuantity,
        singleQuantityAfter: stock.singleQuantity,
        boxQuantityChange: stock.boxQuantity - beforeBox,
        singleQuantityChange: stock.singleQuantity - beforeSingle,
        saleId,
        isFree: false,
      },
      { transaction: t }
    );
  } else {
    // Return stock (when removing an item)
    if (item.unitType === "box") {
      stock.boxQuantity += item.quantity;
    } else {
      stock.singleQuantity += item.quantity;
    }
    await stock.save({ transaction: t });

    await db.StockHistory.create(
      {
        productId: product.id,
        actionType: HistoryActionType.ADJUST,
        boxQuantityBefore: beforeBox,
        singleQuantityBefore: beforeSingle,
        boxQuantityAfter: stock.boxQuantity,
        singleQuantityAfter: stock.singleQuantity,
        boxQuantityChange: stock.boxQuantity - beforeBox,
        singleQuantityChange: stock.singleQuantity - beforeSingle,
        saleId,
        isFree: false,
      },
      { transaction: t }
    );
  }

  // Pricing
  const unitPrice =
    item.customUnitPrice != null
      ? item.customUnitPrice
      : item.unitType === "box"
        ? price.sellPricePerBox
        : price.sellPricePerUnit;

  const costPerUnit = price.buyPricePerBox / product.unitsPerBox;
  const costPrice = item.unitType === "box" ? price.buyPricePerBox : costPerUnit;
  const totalPrice = unitPrice * item.quantity;
  const totalItemCost = costPrice * item.quantity;

  return {
    unitPrice,
    costPrice,
    totalPrice,
    totalItemCost,
    productName: product.name,
    totalUnits: item.unitType === "box" ? item.quantity * product.unitsPerBox : item.quantity,
    priceId: price.id,
  };
}

// ---------- CREATE SALE ----------
export const createSale = async (input: CreateSaleInput) => {
  const t = await db.sequelize.transaction();
  try {
    const sale = await db.Sale.create(
      {
        customerName: input.customerName,
        description: input.description,
        paymentType: input.paymentType,
        paymentStatus: input.paymentStatus || "paid",
      },
      { transaction: t }
    );

    let totalAmount = 0;
    let totalCost = 0;

    for (const item of input.items) {
      const processed = await processSaleItem(sale.id, item, t, true);
      await db.SaleItem.create(
        {
          saleId: sale.id,
          productId: item.productId,
          priceId: processed.priceId,
          unitType: item.unitType,
          quantity: item.quantity,
          totalUnits: processed.totalUnits,
          productName: processed.productName,
          unitPrice: processed.unitPrice,
          costPrice: processed.costPrice,
          totalPrice: processed.totalPrice,
          totalCost: processed.totalItemCost,
        },
        { transaction: t }
      );
      totalAmount += processed.totalPrice;
      totalCost += processed.totalItemCost;
    }

    sale.totalAmount = totalAmount;
    sale.totalCost = totalCost;
    sale.profit = totalAmount - totalCost;
    await sale.save({ transaction: t });

    await t.commit();
    return sale;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

// ---------- UPDATE SALE ----------
export const updateSale = async (saleId: string, input: UpdateSaleInput) => {
  const t = await db.sequelize.transaction();
  try {
    const sale = (await db.Sale.findByPk(saleId, {
      include: [{ association: "items" }],
      transaction: t,
    })) as InstanceType<typeof db.Sale> | null;
    if (!sale) throw new Error("Sale not found");

    // Update metadata
    if (input.customerName !== undefined) sale.customerName = input.customerName;
    if (input.description !== undefined) sale.description = input.description;
    if (input.paymentType) sale.paymentType = input.paymentType;
    if (input.paymentStatus) sale.paymentStatus = input.paymentStatus;
    await sale.save({ transaction: t });

    if (input.items && input.items.length > 0) {
      // Reverse old items
      const oldItems = sale.items ?? [];
      for (const oldItem of oldItems) {
        const product = (await db.Product.findByPk(oldItem.productId, { transaction: t })) as Product | null;
        if (!product) throw new Error("Product not found");
        const price = (await db.ProductPrice.findByPk(oldItem.priceId, { transaction: t })) as ProductPrice | null;
        if (!price) throw new Error("Price not found");

        const stock = (await db.Stock.findOne({
          where: { productId: oldItem.productId },
          transaction: t,
          lock: t.LOCK.UPDATE,
        })) as Stock | null;
        if (!stock) throw new Error("Stock not found");

        const beforeBox = stock.boxQuantity;
        const beforeSingle = stock.singleQuantity;

        if (oldItem.unitType === "box") {
          stock.boxQuantity += oldItem.quantity;
        } else {
          stock.singleQuantity += oldItem.quantity;
        }
        await stock.save({ transaction: t });

        await db.StockHistory.create(
          {
            productId: oldItem.productId,
            actionType: HistoryActionType.ADJUST,
            boxQuantityBefore: beforeBox,
            singleQuantityBefore: beforeSingle,
            boxQuantityAfter: stock.boxQuantity,
            singleQuantityAfter: stock.singleQuantity,
            boxQuantityChange: stock.boxQuantity - beforeBox,
            singleQuantityChange: stock.singleQuantity - beforeSingle,
            saleId,
            isFree: false,
          },
          { transaction: t }
        );

        await oldItem.destroy({ transaction: t });
      }

      // Add new items
      let totalAmount = 0;
      let totalCost = 0;
      for (const item of input.items) {
        const processed = await processSaleItem(sale.id, item, t, true);
        await db.SaleItem.create(
          {
            saleId: sale.id,
            productId: item.productId,
            priceId: processed.priceId,
            unitType: item.unitType,
            quantity: item.quantity,
            totalUnits: processed.totalUnits,
            productName: processed.productName,
            unitPrice: processed.unitPrice,
            costPrice: processed.costPrice,
            totalPrice: processed.totalPrice,
            totalCost: processed.totalItemCost,
          },
          { transaction: t }
        );
        totalAmount += processed.totalPrice;
        totalCost += processed.totalItemCost;
      }

      sale.totalAmount = totalAmount;
      sale.totalCost = totalCost;
      sale.profit = totalAmount - totalCost;
      await sale.save({ transaction: t });
    }

    await t.commit();

    // Reload with items
    const updatedSale = (await db.Sale.findByPk(saleId, {
      include: [{ association: "items" }],
    })) as InstanceType<typeof db.Sale>;
    return updatedSale;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};