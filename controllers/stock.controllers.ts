// controllers/stock.controllers.ts
import { Request, Response } from "express";
import { z } from "zod";
import db from "../models";
import { ContainerType } from "../models/Stock";
import { HistoryActionType } from "../models/StockHistory";
import { validate as isUUID } from "uuid";
import { Transaction } from "sequelize";

const { Stock, Product, Exchange, StockHistory, sequelize } = db;

// ---------- Small helper to extract a string id from params ----------
function getId(value: string | string[] | undefined): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

// ---------- Zod schemas ----------
const createStockSchema = z.object({
  productId: z.string().uuid(),
  boxQuantity: z.number().int().min(0).default(0),
  singleQuantity: z.number().int().min(0).default(0),
  containerType: z.nativeEnum(ContainerType).default(ContainerType.BOX),
});

const updateStockSchema = z.object({
  boxQuantity: z.number().int().min(0),
  singleQuantity: z.number().int().min(0),
  containerType: z.nativeEnum(ContainerType).optional(),
});

const restockSchema = z.object({
  addBoxes: z.number().int().min(0).default(0),
  addSingles: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  isFree: z.boolean().default(false),
});

const exchangeSchema = z.object({
  sourceProductId: z.string().uuid(),
  targetProductId: z.string().uuid(),
  exchangeType: z.enum(["box", "single"]),
  sourceQuantity: z.number().int().positive(),
  notes: z.string().optional(),
});

// ---------- History helper ----------
const recordHistory = async ({
  productId,
  actionType,
  beforeBox,
  beforeSingle,
  afterBox,
  afterSingle,
  notes,
  isFree = false,
  saleId,
  transaction,
}: {
  productId: string;
  actionType: HistoryActionType;
  beforeBox: number;
  beforeSingle: number;
  afterBox: number;
  afterSingle: number;
  notes?: string;
  isFree?: boolean;
  saleId?: string;
  transaction: Transaction;
}) => {
  await StockHistory.create(
    {
      productId,
      actionType,
      boxQuantityBefore: beforeBox,
      singleQuantityBefore: beforeSingle,
      boxQuantityAfter: afterBox,
      singleQuantityAfter: afterSingle,
      boxQuantityChange: afterBox - beforeBox,
      singleQuantityChange: afterSingle - beforeSingle,
      notes: notes ?? undefined,   // notes is optional string, never null
      isFree,
      saleId: saleId ?? undefined,
    },
    { transaction }
  );
};

// ---------- Controllers ----------
export const createStock = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const data = createStockSchema.parse(req.body);

    const existing = await Stock.findOne({
      where: { productId: data.productId },
      transaction,
    });
    if (existing) {
      await transaction.rollback();
      return res.status(400).json({ message: "Stock already exists for this product" });
    }

    const stock = await Stock.create(
      {
        productId: data.productId,
        boxQuantity: data.boxQuantity,
        singleQuantity: data.singleQuantity,
        containerType: data.containerType,
      },
      { transaction }
    );

    await recordHistory({
      productId: data.productId,
      actionType: HistoryActionType.INITIAL,
      beforeBox: 0,
      beforeSingle: 0,
      afterBox: stock.boxQuantity,
      afterSingle: stock.singleQuantity,
      notes: "Initial stock",
      transaction,
    });

    await transaction.commit();
    return res.status(201).json(stock);
  } catch (error) {
    await transaction.rollback();
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.flatten());
    }
    console.error("CREATE STOCK ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateStock = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const id = getId(req.params.id);
    if (!id || !isUUID(id)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid ID" });
    }

    const stock = await Stock.findByPk(id, { transaction });
    if (!stock) {
      await transaction.rollback();
      return res.status(404).json({ message: "Stock not found" });
    }

    const product = await Product.findByPk(stock.productId, { transaction });
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    const data = updateStockSchema.parse(req.body);
    const unitsPerBox = product.unitsPerBox;
    const totalUnits = data.boxQuantity * unitsPerBox + data.singleQuantity;
    const finalBoxes = Math.floor(totalUnits / unitsPerBox);
    const finalSingles = totalUnits % unitsPerBox;

    const beforeBox = stock.boxQuantity;
    const beforeSingle = stock.singleQuantity;

    await stock.update(
      {
        boxQuantity: finalBoxes,
        singleQuantity: finalSingles,
        containerType: data.containerType ?? stock.containerType,
      },
      { transaction }
    );

    await recordHistory({
      productId: stock.productId,
      actionType: HistoryActionType.ADJUST,
      beforeBox,
      beforeSingle,
      afterBox: finalBoxes,
      afterSingle: finalSingles,
      notes: "Manual adjustment",
      transaction,
    });

    await transaction.commit();
    return res.status(200).json(stock);
  } catch (error) {
    await transaction.rollback();
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.flatten());
    }
    console.error("ADJUST STOCK ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const restockProduct = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const id = getId(req.params.id);
    if (!id || !isUUID(id)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid ID" });
    }

    const stock = await Stock.findByPk(id, { transaction });
    if (!stock) {
      await transaction.rollback();
      return res.status(404).json({ message: "Stock not found" });
    }

    const product = await Product.findByPk(stock.productId, { transaction });
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    const data = restockSchema.parse(req.body);
    const unitsPerBox = product.unitsPerBox;
    const addedTotal = data.addBoxes * unitsPerBox + data.addSingles;
    const currentTotal = stock.boxQuantity * unitsPerBox + stock.singleQuantity;
    const newTotal = currentTotal + addedTotal;
    const finalBoxes = Math.floor(newTotal / unitsPerBox);
    const finalSingles = newTotal % unitsPerBox;

    const beforeBox = stock.boxQuantity;
    const beforeSingle = stock.singleQuantity;

    await stock.update(
      { boxQuantity: finalBoxes, singleQuantity: finalSingles },
      { transaction }
    );

    const notes =
      data.notes || `Restocked +${data.addBoxes} boxes, +${data.addSingles} singles`;

    await recordHistory({
      productId: stock.productId,
      actionType: HistoryActionType.RESTOCK,
      beforeBox,
      beforeSingle,
      afterBox: finalBoxes,
      afterSingle: finalSingles,
      notes,
      isFree: data.isFree,
      transaction,
    });

    await transaction.commit();
    return res.status(200).json(stock);
  } catch (error) {
    await transaction.rollback();
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.flatten());
    }
    console.error("RESTOCK ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const exchangeProducts = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const data = exchangeSchema.parse(req.body);

    const sourceProduct = await Product.findByPk(data.sourceProductId, { transaction });
    const targetProduct = await Product.findByPk(data.targetProductId, { transaction });
    if (!sourceProduct || !targetProduct) {
      await transaction.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    let sourceStock = await Stock.findOne({
      where: { productId: data.sourceProductId },
      transaction,
    });
    let targetStock = await Stock.findOne({
      where: { productId: data.targetProductId },
      transaction,
    });

    if (!sourceStock) {
      sourceStock = await Stock.create(
        {
          productId: data.sourceProductId,
          boxQuantity: 0,
          singleQuantity: 0,
          containerType: ContainerType.BOX,
        },
        { transaction }
      );
    }
    if (!targetStock) {
      targetStock = await Stock.create(
        {
          productId: data.targetProductId,
          boxQuantity: 0,
          singleQuantity: 0,
          containerType: ContainerType.BOX,
        },
        { transaction }
      );
    }

    const deductUnits =
      data.exchangeType === "box"
        ? data.sourceQuantity * sourceProduct.unitsPerBox
        : data.sourceQuantity;

    const sourceTotalUnits =
      sourceStock.boxQuantity * sourceProduct.unitsPerBox + sourceStock.singleQuantity;
    if (sourceTotalUnits < deductUnits) {
      await transaction.rollback();
      return res.status(400).json({ message: "Not enough stock in source" });
    }

    const newSourceTotal = sourceTotalUnits - deductUnits;
    const newSourceBoxes = Math.floor(newSourceTotal / sourceProduct.unitsPerBox);
    const newSourceSingles = newSourceTotal % sourceProduct.unitsPerBox;

    const targetTotalUnits =
      targetStock.boxQuantity * targetProduct.unitsPerBox + targetStock.singleQuantity;
    const newTargetTotal = targetTotalUnits + deductUnits;
    const newTargetBoxes = Math.floor(newTargetTotal / targetProduct.unitsPerBox);
    const newTargetSingles = newTargetTotal % targetProduct.unitsPerBox;

    const sourceBeforeBox = sourceStock.boxQuantity;
    const sourceBeforeSingle = sourceStock.singleQuantity;
    const targetBeforeBox = targetStock.boxQuantity;
    const targetBeforeSingle = targetStock.singleQuantity;

    await sourceStock.update(
      { boxQuantity: newSourceBoxes, singleQuantity: newSourceSingles },
      { transaction }
    );
    await targetStock.update(
      { boxQuantity: newTargetBoxes, singleQuantity: newTargetSingles },
      { transaction }
    );

    // History for both sides
    await recordHistory({
      productId: data.sourceProductId,
      actionType: HistoryActionType.EXCHANGE,
      beforeBox: sourceBeforeBox,
      beforeSingle: sourceBeforeSingle,
      afterBox: newSourceBoxes,
      afterSingle: newSourceSingles,
      notes: `Exchanged out ${deductUnits} units to product ${data.targetProductId}`,
      transaction,
    });
    await recordHistory({
      productId: data.targetProductId,
      actionType: HistoryActionType.EXCHANGE,
      beforeBox: targetBeforeBox,
      beforeSingle: targetBeforeSingle,
      afterBox: newTargetBoxes,
      afterSingle: newTargetSingles,
      notes: `Exchanged in ${deductUnits} units from product ${data.sourceProductId}`,
      transaction,
    });

    // Keep Exchange log – notes can be undefined, not null
    await Exchange.create(
      {
        sourceProductId: data.sourceProductId,
        targetProductId: data.targetProductId,
        exchangeType: data.exchangeType,
        sourceQuantity: data.sourceQuantity,
        targetQuantity: deductUnits,
        exchangeValue: data.sourceQuantity,
        notes: data.notes ?? undefined,
      },
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({ message: "Exchange completed" });
  } catch (error) {
    await transaction.rollback();
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.flatten());
    }
    console.error("EXCHANGE ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteStock = async (req: Request, res: Response) => {
  try {
    const id = getId(req.params.id);
    if (!id || !isUUID(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    const stock = await Stock.findByPk(id);
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }
    await stock.destroy();
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getStocks = async (_: Request, res: Response) => {
  const stocks = await Stock.findAll({
    include: [{ model: Product, as: "product" }],
    order: [["createdAt", "DESC"]],
  });
  return res.status(200).json(stocks);
};

export const getStockById = async (req: Request, res: Response) => {
  const id = getId(req.params.id);
  if (!id || !isUUID(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }
  const stock = await Stock.findByPk(id, {
    include: [{ model: Product, as: "product" }],
  });
  if (!stock) {
    return res.status(404).json({ message: "Not found" });
  }
  return res.status(200).json(stock);
};

export const getStockHistory = async (req: Request, res: Response) => {
  const productId = getId(req.params.productId);
  if (!productId || !isUUID(productId)) {
    return res.status(400).json({ message: "Invalid productId" });
  }
  const history = await StockHistory.findAll({
    where: { productId },
    order: [["createdAt", "DESC"]],
  });
  return res.status(200).json(history);
};

export const getExchangeHistory = async (_: Request, res: Response) => {
  const exchanges = await Exchange.findAll({
    include: [
      { model: Product, as: "sourceProduct" },
      { model: Product, as: "targetProduct" },
    ],
    order: [["createdAt", "DESC"]],
  });
  return res.status(200).json(exchanges);
};
