import db from "../models";
import { HistoryActionType } from "../models/StockHistory";
import { calculateUnits } from "../utils/inventory.utils";

const { Stock, Product, ProductPrice, StockHistory, sequelize } = db;

import { Op } from "sequelize";

// ---------- Price listing with advanced filters ----------
export const getProductPricesService = async (filters: {
  productId?: string;
  active?: boolean;         // true = endAt null (active), false = ended
  startDate?: Date;
  endDate?: Date;
  minBuyPrice?: number;
  maxBuyPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: string;          // e.g., 'startAt', 'buyPricePerBox'
  sortOrder?: 'ASC' | 'DESC';
}) => {
  const {
    productId,
    active,
    startDate,
    endDate,
    minBuyPrice,
    maxBuyPrice,
    page = 1,
    limit = 20,
    sortBy = 'startAt',
    sortOrder = 'DESC',
  } = filters;

  const where: any = {};
  if (productId) where.productId = productId;
  if (active !== undefined) {
    if (active) where.endAt = null;
    else where.endAt = { [Op.ne]: null };
  }
  if (startDate) where.startAt = { [Op.gte]: startDate };
  if (endDate) where.startAt = { [Op.lte]: endDate };
  if (minBuyPrice !== undefined) where.buyPricePerBox = { [Op.gte]: minBuyPrice };
  if (maxBuyPrice !== undefined) {
    where.buyPricePerBox = { ...where.buyPricePerBox, [Op.lte]: maxBuyPrice };
  }

  const offset = (page - 1) * limit;
  const { count, rows } = await ProductPrice.findAndCountAll({
    where,
    include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
    order: [[sortBy, sortOrder]],
    offset,
    limit,
  });

  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    data: rows,
  };
};

// Helper to get active price
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
export const restockService = async (stockId: string, data: any) => {
  const transaction = await sequelize.transaction();
  try {
    const stock = await Stock.findByPk(stockId, { transaction });
    if (!stock) throw new Error("Stock not found");

    const product = await Product.findByPk(stock.productId, { transaction });
    if (!product) throw new Error("Product not found");

    let price: InstanceType<typeof ProductPrice> | null = null;

    // 1. If priceId provided, use that price (must exist and belong to same product)
    if (data.priceId) {
      price = await ProductPrice.findOne({
        where: { id: data.priceId, productId: stock.productId },
        transaction,
      });
      if (!price) {
        throw new Error("Provided priceId does not exist or does not belong to this product");
      }
    }
    // 2. Else if newBuyPricePerBox provided, create new price
    else if (data.newBuyPricePerBox && data.newBuyPricePerBox > 0) {
      // End current active price
      const currentPrice = await getActivePrice(stock.productId, transaction);
      await ProductPrice.update(
        { endAt: new Date() },
        { where: { id: currentPrice.id }, transaction }
      );

      // Create new price – use provided sell prices or fallback to current ones
      const newSellPricePerBox = data.newSellPricePerBox ?? currentPrice.sellPricePerBox;
      const newSellPricePerUnit = data.newSellPricePerUnit ?? currentPrice.sellPricePerUnit;

      price = await ProductPrice.create(
        {
          productId: stock.productId,
          buyPricePerBox: data.newBuyPricePerBox,
          sellPricePerBox: newSellPricePerBox,
          sellPricePerUnit: newSellPricePerUnit,
          allowLoss: currentPrice.allowLoss,
          startAt: new Date(),
        },
        { transaction }
      );
    }
    // 3. Default: use currently active price
    else {
      price = await getActivePrice(stock.productId, transaction);
    }

    // Units calculation (unchanged)
    const unitsPerBox = product.unitsPerBox;
    const addedUnits = calculateUnits.toTotalUnits(
      data.addBoxes,
      data.addSingles,
      unitsPerBox
    );
    const currentUnits = calculateUnits.toTotalUnits(
      stock.boxQuantity,
      stock.singleQuantity,
      unitsPerBox
    );
    const final = calculateUnits.toDisplayUnits(
      currentUnits + addedUnits,
      unitsPerBox
    );

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
        notes:
          data.notes ||
          `Restocked ${data.addBoxes} boxes, ${data.addSingles} singles`,
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
export const updateStockHistoryPriceService = async (
  historyId: string,
  newPriceId: string
) => {
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

// Get stock breakdown by price layer for a given stock ID
export const getStockPriceLayersService = async (stockId: string) => {
  const stock = await Stock.findByPk(stockId, {
    include: [{ model: Product, as: 'product' }]
  });
  if (!stock) throw new Error("Stock not found");

  // Fetch all stock history entries for this product, ordered by date (FIFO)
  const histories = await StockHistory.findAll({
    where: { productId: stock.productId },
    order: [['createdAt', 'ASC']],
    include: [{ model: ProductPrice, as: 'price' }]
  });

  // Build layers: each layer represents a batch with remaining quantity
  const layers: {
    priceId: string;
    buyPricePerBox: number;
    sellPricePerBox: number;
    sellPricePerUnit: number;
    boxQuantity: number;
    singleQuantity: number;
    totalUnits: number;
    remainingUnits: number;
    costPerUnit: number;
    profitPerUnit: number;
    potentialProfit: number;
    createdAt: Date;
  }[] = [];

  let remainingTotalUnits = stock.boxQuantity * stock.product!.unitsPerBox + stock.singleQuantity;

  for (const hist of histories) {
    if (remainingTotalUnits <= 0) break;

    const price = hist.price;
    if (!price) continue;

    const unitsAdded = hist.boxQuantityChange * stock.product!.unitsPerBox + hist.singleQuantityChange;
    if (unitsAdded <= 0) continue;

    const takenUnits = Math.min(unitsAdded, remainingTotalUnits);
    const ratio = takenUnits / unitsAdded;

    const boxPart = Math.floor(hist.boxQuantityChange * ratio);
    const singlePart = hist.singleQuantityChange * ratio;
    const finalBoxes = Math.floor(singlePart / stock.product!.unitsPerBox);
    const finalSingles = singlePart % stock.product!.unitsPerBox;
    const finalBoxQuantity = boxPart + finalBoxes;
    const finalSingleQuantity = finalSingles;

    const costPerUnit = price.buyPricePerBox / stock.product!.unitsPerBox;
    const currentSellPricePerUnit = stock.product!.sellPricePerUnit || 0;
    const profitPerUnit = currentSellPricePerUnit - costPerUnit;
    const potentialProfit = takenUnits * profitPerUnit;

    layers.push({
      priceId: price.id,
      buyPricePerBox: price.buyPricePerBox,
      sellPricePerBox: price.sellPricePerBox,
      sellPricePerUnit: price.sellPricePerUnit,
      boxQuantity: finalBoxQuantity,
      singleQuantity: finalSingles,
      totalUnits: takenUnits,
      remainingUnits: takenUnits,
      costPerUnit,
      profitPerUnit,
      potentialProfit,
      createdAt: hist.createdAt,
    });

    remainingTotalUnits -= takenUnits;
  }

  // Also include the current active price if there is remaining stock not covered by history (should not happen, but safe)
  if (remainingTotalUnits > 0) {
    const activePrice = await getActivePrice(stock.productId, {} as any);
    const costPerUnit = activePrice.buyPricePerBox / stock.product!.unitsPerBox;
    const currentSellPricePerUnit = stock.product!.sellPricePerUnit || 0;
    const profitPerUnit = currentSellPricePerUnit - costPerUnit;
    layers.push({
      priceId: activePrice.id,
      buyPricePerBox: activePrice.buyPricePerBox,
      sellPricePerBox: activePrice.sellPricePerBox,
      sellPricePerUnit: activePrice.sellPricePerUnit,
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

  // Aggregate layers with same priceId (in case of multiple restocks at same price)
  const aggregated = new Map();
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

  return Array.from(aggregated.values());
};
// ---------- Manual price activation (deactivates current active) ----------
export const activatePriceService = async (priceId: string, productId?: string) => {
  const transaction = await sequelize.transaction();
  try {
    const price = await ProductPrice.findByPk(priceId, { transaction });
    if (!price) throw new Error("Price not found");

    const targetProductId = productId || price.productId;
    if (price.productId !== targetProductId) {
      throw new Error("Price does not belong to the specified product");
    }

    // Deactivate current active price for this product
    const currentActive = await ProductPrice.findOne({
      where: { productId: targetProductId, endAt: null },
      transaction,
    });
    if (currentActive && currentActive.id !== priceId) {
      await currentActive.update({ endAt: new Date() }, { transaction });
    }

    // Activate the selected price
    await price.update({ endAt: null, startAt: new Date() }, { transaction });

    await transaction.commit();
    return price;
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
    const totalUnits = calculateUnits.toTotalUnits(
      data.boxQuantity,
      data.singleQuantity,
      unitsPerBox
    );
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