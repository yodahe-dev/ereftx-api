import db from "../models";
import { HistoryActionType } from "../models/StockHistory";
import type { Transaction } from "sequelize";
import { CreateSaleInput, UpdateSaleInput } from "../validations/sale.schema";

/**
 * TYPES
 */
interface Product {
  id: string;
  name: string;
  unitsPerBox: number;
}

interface ProductPrice {
  id: string;
  productId: string;
  buyPricePerBox: number;
  sellPricePerBox: number;
  sellPricePerUnit: number;
}

interface Stock {
  productId: string;
  boxQuantity: number;
  singleQuantity: number;
  save: (opts?: any) => Promise<Stock>;
}

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
 * SAFE STOCK CHECK (no mutation)
 */
function canFulfillStock(
  stock: Stock,
  product: Product,
  item: { quantity: number; unitType: "box" | "single" }
): boolean {
  if (item.unitType === "box") {
    return stock.boxQuantity >= item.quantity;
  }

  const totalSingles =
    stock.singleQuantity + stock.boxQuantity * product.unitsPerBox;

  return totalSingles >= item.quantity;
}

/**
 * PROCESS ITEM (optimized version - assumes validation already done)
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
  isAdding: boolean,
  product: Product,
  price: ProductPrice,
  stock: Stock
): Promise<ProcessedItem> {
  const beforeBox = stock.boxQuantity;
  const beforeSingle = stock.singleQuantity;

  if (isAdding) {
    if (item.unitType === "box") {
      stock.boxQuantity -= item.quantity;
    } else {
      const needed = item.quantity;

      if (stock.singleQuantity < needed) {
        const shortage = needed - stock.singleQuantity;
        const boxesToBreak = Math.ceil(shortage / product.unitsPerBox);

        stock.boxQuantity -= boxesToBreak;
        stock.singleQuantity += boxesToBreak * product.unitsPerBox;
      }

      stock.singleQuantity -= needed;
    }
  } else {
    if (item.unitType === "box") {
      stock.boxQuantity += item.quantity;
    } else {
      stock.singleQuantity += item.quantity;
    }
  }

  await stock.save({ transaction: t });

  await db.StockHistory.create(
    {
      productId: product.id,
      priceId: price.id,
      actionType: isAdding ? HistoryActionType.SALE : HistoryActionType.ADJUST,
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

  const unitPrice =
    item.customUnitPrice ??
    (item.unitType === "box"
      ? price.sellPricePerBox
      : price.sellPricePerUnit);

  const costPerUnit = price.buyPricePerBox / product.unitsPerBox;

  const costPrice =
    item.unitType === "box" ? price.buyPricePerBox : costPerUnit;

  const totalUnits =
    item.unitType === "box"
      ? item.quantity * product.unitsPerBox
      : item.quantity;

  return {
    unitPrice,
    costPrice,
    totalPrice: unitPrice * item.quantity,
    totalItemCost: costPrice * item.quantity,
    productName: product.name,
    totalUnits,
    priceId: price.id,
  };
}

/**
 * CREATE SALE (unchanged)
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
      const product = (await db.Product.findByPk(item.productId, {
        transaction: t,
      })) as Product;
      const price = (await db.ProductPrice.findOne({
        where: { productId: item.productId, endAt: null },
        transaction: t,
      })) as ProductPrice;
      const stock = (await db.Stock.findOne({
        where: { productId: item.productId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      })) as Stock;

      if (!product || !price || !stock) {
        throw new Error(`Missing data for product ${item.productId}`);
      }

      if (!canFulfillStock(stock, product, item)) {
        throw new Error(`Not enough stock for ${product.name}`);
      }

      const processed = await processSaleItem(
        sale.id,
        item,
        t,
        true,
        product,
        price,
        stock
      );

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

    return await db.Sale.findByPk(sale.id, {
      include: [{ association: "items" }],
    });
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/**
 * UPDATE SALE (FIXED: never throws stock error on metadata-only changes)
 */
export const updateSale = async (saleId: string, input: UpdateSaleInput) => {
  const t = await db.sequelize.transaction();

  try {
    const sale = await db.Sale.findByPk(saleId, {
      include: [{ association: "items" }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!sale) throw new Error("Sale not found");

    // Update sale metadata (always allowed)
    if (input.customerName !== undefined) sale.customerName = input.customerName;
    if (input.description !== undefined) sale.description = input.description;
    if (input.paymentType) sale.paymentType = input.paymentType;
    if (input.paymentStatus) sale.paymentStatus = input.paymentStatus;

    // If no items provided, just save metadata and return
    if (!input.items || input.items.length === 0) {
      await sale.save({ transaction: t });
      await t.commit();
      return await db.Sale.findByPk(saleId, {
        include: [{ association: "items" }],
      });
    }

    const oldItems = sale.items ?? [];
    const newItems = input.items;

    // Helper to compare stock‑affecting fields
    const areItemsEqual = (a: any, b: any) =>
      a.productId === b.productId &&
      a.quantity === b.quantity &&
      a.unitType === b.unitType;

    // Compare items in order (frontend preserves order)
    const itemsIdentical =
      oldItems.length === newItems.length &&
      oldItems.every((old, idx) => areItemsEqual(old, newItems[idx]));

    // If items are identical (only custom prices may have changed), update in‑place
    if (itemsIdentical) {
      for (let i = 0; i < newItems.length; i++) {
        const newItem = newItems[i];
        const oldItem = oldItems[i];
        if (newItem.customUnitPrice !== undefined && newItem.customUnitPrice !== oldItem.unitPrice) {
          const product = (await db.Product.findByPk(newItem.productId, {
            transaction: t,
          })) as Product;
          const price = (await db.ProductPrice.findOne({
            where: { productId: newItem.productId, endAt: null },
            transaction: t,
          })) as ProductPrice;
          if (!product || !price) {
            throw new Error(`Missing data for product ${newItem.productId}`);
          }

          const unitPrice = newItem.customUnitPrice;
          const costPerUnit = price.buyPricePerBox / product.unitsPerBox;
          const costPrice = newItem.unitType === "box" ? price.buyPricePerBox : costPerUnit;
          const totalUnits =
            newItem.unitType === "box"
              ? newItem.quantity * product.unitsPerBox
              : newItem.quantity;

          await db.SaleItem.update(
            {
              unitPrice,
              costPrice,
              totalPrice: unitPrice * newItem.quantity,
              totalCost: costPrice * newItem.quantity,
              totalUnits,
            },
            { where: { id: oldItem.id }, transaction: t }
          );
        }
      }

      // Recalculate totals after potential price changes
      const updatedItems = await db.SaleItem.findAll({
        where: { saleId },
        transaction: t,
      });
      let totalAmount = 0;
      let totalCost = 0;
      for (const item of updatedItems) {
        totalAmount += Number(item.totalPrice);
        totalCost += Number(item.totalCost);
      }
      sale.totalAmount = totalAmount;
      sale.totalCost = totalCost;
      sale.profit = totalAmount - totalCost;
      await sale.save({ transaction: t });
      await t.commit();
      return await db.Sale.findByPk(saleId, {
        include: [{ association: "items" }],
      });
    }

    // --- Items have changed in stock‑affecting ways ---

    // 1. Reverse old stock (add back)
    for (const oldItem of oldItems) {
      const product = (await db.Product.findByPk(oldItem.productId, {
        transaction: t,
      })) as Product;
      const price = (await db.ProductPrice.findOne({
        where: { productId: oldItem.productId, endAt: null },
        transaction: t,
      })) as ProductPrice;
      const stock = (await db.Stock.findOne({
        where: { productId: oldItem.productId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      })) as Stock;

      if (!product || !price || !stock) {
        throw new Error(`Missing data for product ${oldItem.productId}`);
      }

      await processSaleItem(
        sale.id,
        {
          productId: oldItem.productId,
          quantity: oldItem.quantity,
          unitType: oldItem.unitType,
        },
        t,
        false, // isAdding = false -> reverse
        product,
        price,
        stock
      );
    }

    // Delete old SaleItem records
    await db.SaleItem.destroy({
      where: { saleId },
      transaction: t,
    });

    // 2. Validate new items against current stock (after reversal)
    for (const item of newItems) {
      const product = (await db.Product.findByPk(item.productId, {
        transaction: t,
      })) as Product;
      const stock = (await db.Stock.findOne({
        where: { productId: item.productId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      })) as Stock;

      if (!product || !stock) {
        throw new Error(`Invalid product data for ${item.productId}`);
      }

      if (!canFulfillStock(stock, product, item)) {
        throw new Error(`Not enough stock for ${product.name}`);
      }
    }

    // 3. Apply new items
    let totalAmount = 0;
    let totalCost = 0;

    for (const item of newItems) {
      const product = (await db.Product.findByPk(item.productId, {
        transaction: t,
      })) as Product;
      const price = (await db.ProductPrice.findOne({
        where: { productId: item.productId, endAt: null },
        transaction: t,
      })) as ProductPrice;
      const stock = (await db.Stock.findOne({
        where: { productId: item.productId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      })) as Stock;

      const processed = await processSaleItem(
        sale.id,
        item,
        t,
        true,
        product,
        price,
        stock
      );

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

    return await db.Sale.findByPk(saleId, {
      include: [{ association: "items" }],
    });
  } catch (err) {
    await t.rollback();
    throw err;
  }
};