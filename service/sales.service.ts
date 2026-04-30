import db from "../models";
import { HistoryActionType } from "../models/StockHistory";
import type { Transaction } from "sequelize";
import { CreateSaleInput, UpdateSaleInput } from "../validations/sale.schema";

// Type aliases – using the attribute interfaces from model files for clarity
interface Product {
  id: string;
  name: string;
  unitsPerBox: number;
}
interface ProductPrice {
  id: string;
  buyPricePerBox: number;
  sellPricePerBox: number;
  sellPricePerUnit: number;
}
interface Stock {
  boxQuantity: number;
  singleQuantity: number;
  save: (opts?: any) => Promise<Stock>;
}

// Helper return type
interface ProcessedItem {
  unitPrice: number;
  costPrice: number;
  totalPrice: number;
  totalItemCost: number;
  productName: string;
  totalUnits: number;
  priceId: string;
}

/**
 * Core helper – processes a single sale item by deducting/returning stock and
 * calculating prices. ALWAYS records StockHistory with the correct priceId.
 */
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
  // Fetch required entities
  const product = await db.Product.findByPk(item.productId, { transaction: t }) as Product | null;
  if (!product) throw new Error(`Product not found: ${item.productId}`);

  const price = await db.ProductPrice.findOne({
    where: { productId: item.productId, endAt: null },
    transaction: t,
  }) as ProductPrice | null;
  if (!price) throw new Error(`No active price for product ${item.productId}`);

  const stock = await db.Stock.findOne({
    where: { productId: item.productId },
    transaction: t,
    lock: t.LOCK.UPDATE,
  }) as Stock | null;
  if (!stock) throw new Error(`Stock not found for product ${item.productId}`);

  const beforeBox = stock.boxQuantity;
  const beforeSingle = stock.singleQuantity;

  if (isAdding) {
    // Deduct stock
    if (item.unitType === "box") {
      if (stock.boxQuantity < item.quantity)
        throw new Error(`Not enough boxes of ${product.name} (have ${stock.boxQuantity})`);
      stock.boxQuantity -= item.quantity;
    } else {
      // Single deduction with automatic box‑breaking
      if (stock.singleQuantity < item.quantity) {
        const shortage = item.quantity - stock.singleQuantity;
        const boxesToBreak = Math.ceil(shortage / product.unitsPerBox);
        if (stock.boxQuantity < boxesToBreak)
          throw new Error(
            `Not enough singles of ${product.name}. Need ${item.quantity}, have ${stock.singleQuantity} singles and ${stock.boxQuantity} boxes.`
          );
        // Break boxes into singles
        stock.boxQuantity -= boxesToBreak;
        stock.singleQuantity += boxesToBreak * product.unitsPerBox;
      }
      stock.singleQuantity -= item.quantity;
    }

    await stock.save({ transaction: t });

    // Record stock history WITH priceId
    await db.StockHistory.create(
      {
        productId: product.id,
        priceId: price.id,   // <--- THIS IS THE CRITICAL FIX
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
        priceId: price.id,
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
  const totalUnits = item.unitType === "box" ? item.quantity * product.unitsPerBox : item.quantity;

  return {
    unitPrice,
    costPrice,
    totalPrice,
    totalItemCost,
    productName: product.name,
    totalUnits,
    priceId: price.id,
  };
}

/**
 * CREATE SALE
 */
export const createSale = async (input: CreateSaleInput) => {
  const t = await db.sequelize.transaction();
  try {
    const sale = await db.Sale.create(
      {
        customerName: input.customerName,
        description: input.description,
        paymentType: input.paymentType,
        paymentStatus: input.paymentStatus,
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
    // Reload with items for the response
    const fullSale = await db.Sale.findByPk(sale.id, {
      include: [{ association: "items" }],
    });
    return fullSale;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/**
 * UPDATE SALE
 */
export const updateSale = async (saleId: string, input: UpdateSaleInput) => {
  const t = await db.sequelize.transaction();
  try {
    const sale = await db.Sale.findByPk(saleId, {
      include: [{ association: "items" }],
      transaction: t,
    });
    if (!sale) throw new Error("Sale not found");

    // Update metadata
    if (input.customerName !== undefined) sale.customerName = input.customerName;
    if (input.description !== undefined) sale.description = input.description;
    if (input.paymentType) sale.paymentType = input.paymentType;
    if (input.paymentStatus) sale.paymentStatus = input.paymentStatus;
    await sale.save({ transaction: t });

    // If items are provided, replace them entirely
    if (input.items && input.items.length > 0) {
      // Reverse old items (return stock)
      const oldItems = sale.items ?? [];
      for (const oldItem of oldItems) {
        // Use processSaleItem with isAdding=false to return stock
        await processSaleItem(
          sale.id,
          {
            productId: oldItem.productId,
            quantity: oldItem.quantity,
            unitType: oldItem.unitType,
          },
          t,
          false
        );
        await oldItem.destroy({ transaction: t });
      }

      // Process new items
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
    const updatedSale = await db.Sale.findByPk(saleId, {
      include: [{ association: "items" }],
    });
    return updatedSale;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};