import db from "../../models";
import { HistoryActionType } from "../../models/StockHistory";
import { calculateUnits } from "./inventory.utils";

const { Stock, Product, ProductPrice, StockHistory, sequelize } = db;

// ---------- existing helper ----------
const getActivePrice = async (productId: string, transaction: any) => {
  const price = await ProductPrice.findOne({
    where: { productId, endAt: null },
    transaction,
  });
  if (!price) {
    throw new Error(
      `No active price found for product ${productId}. Create a product price first.`
    );
  }
  return price;
};

// ========== STOCK ==========
export const createStockService = async (data: any) => {
  const transaction = await sequelize.transaction();
  try {
    const price = await getActivePrice(data.productId, transaction);
    const stock = await Stock.create(data, { transaction });

    await StockHistory.create(
      {
        productId: data.productId,
        priceId: price.id,
        actionType: HistoryActionType.INITIAL,
        boxQuantityBefore: 0,
        singleQuantityBefore: 0,
        boxQuantityAfter: stock.boxQuantity,
        singleQuantityAfter: stock.singleQuantity,
        boxQuantityChange: stock.boxQuantity,
        singleQuantityChange: stock.singleQuantity,
        notes: "Initial stock creation",
        isFree: false,
      },
      { transaction }
    );

    await transaction.commit();
    return stock;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const updateStockService = async (id: string, data: any) => {
  const transaction = await sequelize.transaction();
  try {
    const stock = await Stock.findByPk(id, { transaction });
    if (!stock) throw new Error("Stock not found");

    const product = await Product.findByPk(stock.productId, { transaction });
    if (!product) throw new Error("Product not found");

    const price = await getActivePrice(stock.productId, transaction);

    const unitsPerBox = product.unitsPerBox;
    const newBoxQuantity = data.boxQuantity !== undefined ? data.boxQuantity : stock.boxQuantity;
    const newSingleQuantity = data.singleQuantity !== undefined ? data.singleQuantity : stock.singleQuantity;
    const newContainerType = data.containerType ?? stock.containerType;

    const totalUnits = calculateUnits.toTotalUnits(newBoxQuantity, newSingleQuantity, unitsPerBox);
    const final = calculateUnits.toDisplayUnits(totalUnits, unitsPerBox);

    const beforeBox = stock.boxQuantity;
    const beforeSingle = stock.singleQuantity;

    if (final.boxes === beforeBox && final.singles === beforeSingle && newContainerType === stock.containerType) {
      await transaction.commit();
      return stock;
    }

    await stock.update(
      { boxQuantity: final.boxes, singleQuantity: final.singles, containerType: newContainerType },
      { transaction }
    );

    await StockHistory.create(
      {
        productId: stock.productId,
        priceId: price.id,
        actionType: HistoryActionType.ADJUST,
        boxQuantityBefore: beforeBox,
        singleQuantityBefore: beforeSingle,
        boxQuantityAfter: final.boxes,
        singleQuantityAfter: final.singles,
        boxQuantityChange: final.boxes - beforeBox,
        singleQuantityChange: final.singles - beforeSingle,
        notes: data.notes || "Manual adjustment",
        isFree: false,
      },
      { transaction }
    );

    await transaction.commit();
    return stock;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const restockService = async (stockId: string, data: any) => {
  const transaction = await sequelize.transaction();
  try {
    const stock = await Stock.findByPk(stockId, { transaction });
    if (!stock) throw new Error("Stock not found");

    const product = await Product.findByPk(stock.productId, { transaction });
    if (!product) throw new Error("Product not found");

    let price = await getActivePrice(stock.productId, transaction);

    if (data.newBuyPricePerBox && data.newBuyPricePerBox > 0) {
      await ProductPrice.update(
        { endAt: new Date() },
        { where: { id: price.id }, transaction }
      );
      price = await ProductPrice.create(
        {
          productId: stock.productId,
          buyPricePerBox: data.newBuyPricePerBox,
          sellPricePerBox: Number(price.sellPricePerBox),
          sellPricePerUnit: Number(price.sellPricePerUnit),
          allowLoss: price.allowLoss,
          startAt: new Date(),
        },
        { transaction }
      );
    }

    const unitsPerBox = product.unitsPerBox;
    const addedUnits = calculateUnits.toTotalUnits(data.addBoxes, data.addSingles, unitsPerBox);
    const currentUnits = calculateUnits.toTotalUnits(stock.boxQuantity, stock.singleQuantity, unitsPerBox);
    const final = calculateUnits.toDisplayUnits(currentUnits + addedUnits, unitsPerBox);

    const beforeBox = stock.boxQuantity;
    const beforeSingle = stock.singleQuantity;

    await stock.update(
      { boxQuantity: final.boxes, singleQuantity: final.singles },
      { transaction }
    );

    await StockHistory.create(
      {
        productId: stock.productId,
        priceId: price.id,
        actionType: HistoryActionType.RESTOCK,
        boxQuantityBefore: beforeBox,
        singleQuantityBefore: beforeSingle,
        boxQuantityAfter: final.boxes,
        singleQuantityAfter: final.singles,
        boxQuantityChange: final.boxes - beforeBox,
        singleQuantityChange: final.singles - beforeSingle,
        notes: data.notes || `Restocked ${data.addBoxes} boxes, ${data.addSingles} singles`,
        isFree: data.isFree,
      },
      { transaction }
    );

    await transaction.commit();
    return stock;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// ========== STOCK HISTORY ==========
export const updateStockHistoryService = async (id: string, data: any) => {
  const history = await StockHistory.findByPk(id);
  if (!history) throw new Error("Stock history record not found");

  // If changing quantities, ensure consistency? We'll trust the caller.
  await history.update(data);
  return history;
};

export const deleteStockHistoryService = async (id: string) => {
  const history = await StockHistory.findByPk(id);
  if (!history) throw new Error("Stock history record not found");
  await history.destroy();
  return { message: "History deleted successfully" };
};

// ========== PRODUCT PRICE ==========
export const createProductPriceService = async (data: any) => {
  // If a new active price is being set, end the current one
  const transaction = await sequelize.transaction();
  try {
    if (!data.startAt) data.startAt = new Date();

    // End the currently active price (endAt is null) for this product
    await ProductPrice.update(
      { endAt: data.startAt },
      { where: { productId: data.productId, endAt: null }, transaction }
    );

    const price = await ProductPrice.create(data, { transaction });
    await transaction.commit();
    return price;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const updateProductPriceService = async (id: string, data: any) => {
  const price = await ProductPrice.findByPk(id);
  if (!price) throw new Error("Price record not found");
  await price.update(data);
  return price;
};

export const deleteProductPriceService = async (id: string) => {
  const price = await ProductPrice.findByPk(id);
  if (!price) throw new Error("Price record not found");

  // If it's the active price (endAt == null), you might want to handle differently,
  // but we allow deletion (caution advised).
  await price.destroy();
  return { message: "Price deleted successfully" };
};