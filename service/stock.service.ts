import db from "../models";
import { HistoryActionType } from "../models/StockHistory";
import { calculateUnits } from "../utils/inventory.utils";
import { Op } from "sequelize";

const { Stock, Product, ProductPrice, StockHistory, sequelize } = db;

// Helper: get active price
const getActivePrice = async (productId: string, transaction: any) => {
  const price = await ProductPrice.findOne({
    where: { productId, endAt: null },
    transaction,
  });
  if (!price) {
    throw new Error(`No active price found for product ${productId}. Create a product price first.`);
  }
  return price;
};

// ========== STOCK CREATION ==========
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

// ========== RESTOCK ==========
export const restockService = async (stockId: string, data: any) => {
  const transaction = await sequelize.transaction();
  try {
    const stock = await Stock.findByPk(stockId, { transaction });
    if (!stock) throw new Error("Stock not found");
    const product = await Product.findByPk(stock.productId, { transaction });
    if (!product) throw new Error("Product not found");

    let price: InstanceType<typeof ProductPrice> | null = null;

    // Use existing price by ID
    if (data.priceId) {
      price = await ProductPrice.findOne({
        where: { id: data.priceId, productId: stock.productId },
        transaction,
      });
      if (!price) throw new Error("Provided priceId does not exist or does not belong to this product");
    } else {
      price = await getActivePrice(stock.productId, transaction);
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
        priceId: price!.id,
        actionType: HistoryActionType.RESTOCK,
        boxQuantityBefore: beforeBox,
        singleQuantityBefore: beforeSingle,
        boxQuantityAfter: final.boxes,
        singleQuantityAfter: final.singles,
        boxQuantityChange: final.boxes - beforeBox,
        singleQuantityChange: final.singles - beforeSingle,
        notes: data.notes || `Restocked ${data.addBoxes} boxes, ${data.addSingles} singles`,
        isFree: data.isFree || false,
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

// ========== ASSIGN NEW PRICE TO PORTION OF STOCK (SPLIT) ==========
export const assignPriceToStockService = async (stockId: string, data: any) => {
  const transaction = await sequelize.transaction();
  try {
    const stock = await Stock.findByPk(stockId, {
      include: [{ model: Product, as: 'product' }],
      transaction,
    });
    if (!stock) throw new Error("Stock not found");
    const product = stock.product!;

    const newPrice = await ProductPrice.findByPk(data.priceId, { transaction });
    if (!newPrice) throw new Error("Price not found");
    if (newPrice.productId !== stock.productId) throw new Error("Price does not belong to this product");

    const requestedBoxes = Number(data.boxQuantity) || 0;
    const requestedSingles = Number(data.singleQuantity) || 0;
    if (requestedBoxes === 0 && requestedSingles === 0) {
      throw new Error("Must specify at least some quantity to reassign");
    }
    const requestedUnits = requestedBoxes * product.unitsPerBox + requestedSingles;
    if (requestedUnits <= 0) throw new Error("Invalid quantity");

    const currentUnits = stock.boxQuantity * product.unitsPerBox + stock.singleQuantity;
    if (requestedUnits > currentUnits) {
      throw new Error("Insufficient stock to assign this quantity");
    }

    // Reduce original stock
    let newBoxes = stock.boxQuantity - requestedBoxes;
    let newSingles = stock.singleQuantity - requestedSingles;
    const extraBoxes = Math.floor(newSingles / product.unitsPerBox);
    newBoxes += extraBoxes;
    newSingles = newSingles % product.unitsPerBox;

    await stock.update({ boxQuantity: newBoxes, singleQuantity: newSingles }, { transaction });

    // Create new stock entry for the reassigned portion
    const newStock = await Stock.create(
      {
        productId: stock.productId,
        boxQuantity: requestedBoxes,
        singleQuantity: requestedSingles,
        containerType: stock.containerType,
      },
      { transaction }
    );

    // Record history for new stock with new price
    await StockHistory.create(
      {
        productId: stock.productId,
        priceId: newPrice.id,
        actionType: HistoryActionType.ADJUST,
        boxQuantityBefore: 0,
        singleQuantityBefore: 0,
        boxQuantityAfter: requestedBoxes,
        singleQuantityAfter: requestedSingles,
        boxQuantityChange: requestedBoxes,
        singleQuantityChange: requestedSingles,
        notes: data.notes || `Price reassigned to ${newPrice.buyPricePerBox} ETB/box`,
        isFree: false,
      },
      { transaction }
    );

    // Record adjustment for the reduction
    const activePrice = await getActivePrice(stock.productId, transaction);
    await StockHistory.create(
      {
        productId: stock.productId,
        priceId: activePrice.id,
        actionType: HistoryActionType.ADJUST,
        boxQuantityBefore: stock.boxQuantity,
        singleQuantityBefore: stock.singleQuantity,
        boxQuantityAfter: newBoxes,
        singleQuantityAfter: newSingles,
        boxQuantityChange: newBoxes - stock.boxQuantity,
        singleQuantityChange: newSingles - stock.singleQuantity,
        notes: `Removed ${requestedBoxes} boxes, ${requestedSingles} singles for price reassignment`,
        isFree: false,
      },
      { transaction }
    );

    await transaction.commit();
    return { originalStock: stock, newStock };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// ========== STOCK ADJUSTMENT (manual update) ==========
export const updateStockService = async (id: string, data: any) => {
  const transaction = await sequelize.transaction();
  try {
    const stock = await Stock.findByPk(id, { transaction });
    if (!stock) throw new Error("Stock not found");
    const product = await Product.findByPk(stock.productId, { transaction });
    if (!product) throw new Error("Product not found");

    const price = await getActivePrice(stock.productId, transaction);
    const unitsPerBox = product.unitsPerBox;
    const totalUnits = calculateUnits.toTotalUnits(data.boxQuantity, data.singleQuantity, unitsPerBox);
    const final = calculateUnits.toDisplayUnits(totalUnits, unitsPerBox);

    const beforeBox = stock.boxQuantity;
    const beforeSingle = stock.singleQuantity;

    await stock.update(
      {
        boxQuantity: final.boxes,
        singleQuantity: final.singles,
        containerType: data.containerType ?? stock.containerType,
      },
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
        notes: "Manual adjustment",
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

// ========== UPDATE STOCK HISTORY PRICE ID ==========
export const updateStockHistoryPriceService = async (historyId: string, newPriceId: string) => {
  const transaction = await sequelize.transaction();
  try {
    const history = await StockHistory.findByPk(historyId, { transaction });
    if (!history) throw new Error("Stock history record not found");
    const newPrice = await ProductPrice.findByPk(newPriceId, { transaction });
    if (!newPrice) throw new Error("Price not found");
    if (newPrice.productId !== history.productId) {
      throw new Error("New price does not belong to the same product");
    }
    await history.update({ priceId: newPriceId }, { transaction });
    await transaction.commit();
    return history;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// ========== STOCK BREAKDOWN BY PRICE PERIOD (FIFO) ==========
export const getStockPriceLayersService = async (stockId: string) => {
  const stock = await Stock.findByPk(stockId, {
    include: [{ model: Product, as: 'product' }],
  });
  if (!stock) throw new Error("Stock not found");
  const product = stock.product!;

  const histories = await StockHistory.findAll({
    where: { productId: stock.productId },
    order: [['createdAt', 'ASC']],
    include: [{ model: ProductPrice, as: 'price', required: false }],
  });

  const layers: any[] = [];
  let remainingTotalUnits = stock.boxQuantity * product.unitsPerBox + stock.singleQuantity;

  for (const hist of histories) {
    if (remainingTotalUnits <= 0) break;
    let price = hist.price;
    if (!price && hist.priceId) {
      price = await ProductPrice.findByPk(hist.priceId);
    }
    if (!price) continue;

    const unitsAdded = hist.boxQuantityChange * product.unitsPerBox + hist.singleQuantityChange;
    if (unitsAdded <= 0) continue;

    const takenUnits = Math.min(unitsAdded, remainingTotalUnits);
    const ratio = takenUnits / unitsAdded;

    const boxPart = Math.floor(hist.boxQuantityChange * ratio);
    const singlePart = hist.singleQuantityChange * ratio;
    const finalBoxes = Math.floor(singlePart / product.unitsPerBox);
    const finalSingles = singlePart % product.unitsPerBox;
    const finalBoxQuantity = boxPart + finalBoxes;
    const finalSingleQuantity = finalSingles;

    const costPerUnit = price.buyPricePerBox / product.unitsPerBox;
    const currentSellPricePerUnit = product.sellPricePerUnit || 0;
    const profitPerUnit = currentSellPricePerUnit - costPerUnit;
    const potentialProfit = takenUnits * profitPerUnit;

    layers.push({
      priceId: price.id,
      buyPricePerBox: price.buyPricePerBox,
      sellPricePerBox: price.sellPricePerBox,
      sellPricePerUnit: price.sellPricePerUnit,
      startAt: price.startAt,
      endAt: price.endAt,
      boxQuantity: finalBoxQuantity,
      singleQuantity: finalSingleQuantity,
      totalUnits: takenUnits,
      remainingUnits: takenUnits,
      costPerUnit,
      profitPerUnit,
      potentialProfit,
      createdAt: hist.createdAt,
    });

    remainingTotalUnits -= takenUnits;
  }

  if (remainingTotalUnits > 0) {
    const activePrice = await getActivePrice(stock.productId, {} as any);
    const costPerUnit = activePrice.buyPricePerBox / product.unitsPerBox;
    const currentSellPricePerUnit = product.sellPricePerUnit || 0;
    const profitPerUnit = currentSellPricePerUnit - costPerUnit;
    layers.push({
      priceId: activePrice.id,
      buyPricePerBox: activePrice.buyPricePerBox,
      sellPricePerBox: activePrice.sellPricePerBox,
      sellPricePerUnit: activePrice.sellPricePerUnit,
      startAt: activePrice.startAt,
      endAt: activePrice.endAt,
      boxQuantity: 0,
      singleQuantity: 0,
      totalUnits: remainingTotalUnits,
      remainingUnits: remainingTotalUnits,
      costPerUnit,
      profitPerUnit,
      potentialProfit: remainingTotalUnits * profitPerUnit,
      createdAt: new Date(),
    });
  }

  // Aggregate by priceId
  const aggregated = new Map<string, any>();
  for (const layer of layers) {
    if (aggregated.has(layer.priceId)) {
      const existing = aggregated.get(layer.priceId);
      existing.boxQuantity += layer.boxQuantity;
      existing.singleQuantity += layer.singleQuantity;
      existing.totalUnits += layer.totalUnits;
      existing.remainingUnits += layer.remainingUnits;
      existing.potentialProfit += layer.potentialProfit;
    } else {
      aggregated.set(layer.priceId, { ...layer });
    }
  }

  return Array.from(aggregated.values()).sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );
};