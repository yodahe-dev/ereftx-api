import db from "../models";
import { Request, Response } from "express";
import { validate as isUUID } from "uuid";
import { Transaction } from "sequelize";
import { ContainerType } from "../models/Stock";
import { HistoryActionType } from "../models/StockHistory";

const { Stock, Product, Exchange, StockHistory, sequelize } = db;

const DEFAULT_CONTAINER_TYPE: ContainerType = ContainerType.BOX;

const getId = (id: string | string[] | undefined): string | null => {
  if (!id) return null;
  if (Array.isArray(id)) return id[0] ?? null;
  return id;
};

// ----------------------------------------------------------------------
// Helper: record stock history (used only for INITIAL and RESTOCK now)
// ----------------------------------------------------------------------
interface RecordHistoryOptions {
  productId: string;
  actionType: HistoryActionType;
  beforeBox: number;
  beforeSingle: number;
  afterBox: number;
  afterSingle: number;
  notes?: string;
  isFree?: boolean;
  transaction?: Transaction;
}

const recordStockHistory = async ({
  productId,
  actionType,
  beforeBox,
  beforeSingle,
  afterBox,
  afterSingle,
  notes,
  isFree = false,
  transaction,
}: RecordHistoryOptions) => {
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
      notes: notes || null,
      isFree,
    },
    { transaction }
  );
};

// ----------------------------------------------------------------------
// Create initial stock (INITIAL action) – history recorded
// ----------------------------------------------------------------------
export const createStock = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const { productId, boxQuantity, singleQuantity, containerType } = req.body;

    if (!productId || !isUUID(productId)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid productId" });
    }

    const existingStock = await Stock.findOne({ where: { productId }, transaction });
    if (existingStock) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Stock already exists for this product. Use restock/update instead.",
      });
    }

    const stock = await Stock.create(
      {
        productId,
        boxQuantity: boxQuantity ?? 0,
        singleQuantity: singleQuantity ?? 0,
        containerType:
          containerType && Object.values(ContainerType).includes(containerType)
            ? containerType
            : DEFAULT_CONTAINER_TYPE,
      },
      { transaction }
    );

    await recordStockHistory({
      productId,
      actionType: HistoryActionType.INITIAL,
      beforeBox: 0,
      beforeSingle: 0,
      afterBox: stock.boxQuantity,
      afterSingle: stock.singleQuantity,
      notes: "Initial stock creation",
      transaction,
    });

    await transaction.commit();
    return res.status(201).json(stock);
  } catch (error) {
    await transaction.rollback();
    console.error("CREATE STOCK ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ----------------------------------------------------------------------
// Get all stocks
// ----------------------------------------------------------------------
export const getStocks = async (_: Request, res: Response) => {
  try {
    const stocks = await Stock.findAll({
      include: [{ model: Product, as: "product" }],
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(stocks);
  } catch (error) {
    console.error("GET STOCK ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ----------------------------------------------------------------------
// Get stock by ID
// ----------------------------------------------------------------------
export const getStockById = async (req: Request, res: Response) => {
  try {
    const id = getId(req.params.id);
    if (!id || !isUUID(id)) return res.status(400).json({ message: "Invalid ID" });
    const stock = await Stock.findByPk(id, { include: [{ model: Product, as: "product" }] });
    if (!stock) return res.status(404).json({ message: "Not found" });
    return res.status(200).json(stock);
  } catch (error) {
    console.error("GET STOCK BY ID ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ----------------------------------------------------------------------
// Adjust stock (manual correction) – NO history recorded
// ----------------------------------------------------------------------
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
      return res.status(404).json({ message: "Not found" });
    }

    const product = await Product.findByPk(stock.productId, { transaction });
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    const { boxQuantity, singleQuantity, containerType } = req.body;

    // Use provided values or fallback to current
    const newBox = boxQuantity !== undefined ? Number(boxQuantity) : stock.boxQuantity;
    const newSingle = singleQuantity !== undefined ? Number(singleQuantity) : stock.singleQuantity;

    // Validate non‑negative
    if (newBox < 0 || newSingle < 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Quantities cannot be negative" });
    }

    const unitsPerBox = product.unitsPerBox;
    if (unitsPerBox <= 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid unitsPerBox for product" });
    }

    // Recalculate total and normalize
    const totalUnits = newBox * unitsPerBox + newSingle;
    const finalBoxes = Math.floor(totalUnits / unitsPerBox);
    const finalSingles = totalUnits % unitsPerBox;

    await stock.update(
      {
        boxQuantity: finalBoxes,
        singleQuantity: finalSingles,
        containerType:
          containerType && Object.values(ContainerType).includes(containerType)
            ? containerType
            : stock.containerType,
      },
      { transaction }
    );

    // NO history record for adjustments

    await transaction.commit();
    return res.status(200).json(stock);
  } catch (error) {
    await transaction.rollback();
    console.error("UPDATE STOCK ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ----------------------------------------------------------------------
// Restock (add boxes and/or singles) – history recorded
// ----------------------------------------------------------------------
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

    const {
      addBoxes = 0,
      addSingles = 0,
      notes,
      isFree = false,
    } = req.body;

    const addBoxesNum = Number(addBoxes);
    const addSinglesNum = Number(addSingles);

    // Validate inputs
    if (isNaN(addBoxesNum) || isNaN(addSinglesNum) || addBoxesNum < 0 || addSinglesNum < 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "addBoxes and addSingles must be non‑negative numbers" });
    }

    const unitsPerBox = product.unitsPerBox;
    if (unitsPerBox <= 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid unitsPerBox for product" });
    }

    // Calculate new quantities
    const currentTotalUnits = stock.boxQuantity * unitsPerBox + stock.singleQuantity;
    const addedTotalUnits = addBoxesNum * unitsPerBox + addSinglesNum;
    const newTotalUnits = currentTotalUnits + addedTotalUnits;

    const finalBoxes = Math.floor(newTotalUnits / unitsPerBox);
    const finalSingles = newTotalUnits % unitsPerBox;

    const beforeBox = stock.boxQuantity;
    const beforeSingle = stock.singleQuantity;

    await stock.update(
      {
        boxQuantity: finalBoxes,
        singleQuantity: finalSingles,
      },
      { transaction }
    );

    const historyNotes = notes || `Restocked: +${addBoxesNum} boxes, +${addSinglesNum} singles${isFree ? " (free)" : ""}`;

    await recordStockHistory({
      productId: stock.productId,
      actionType: HistoryActionType.RESTOCK,
      beforeBox,
      beforeSingle,
      afterBox: finalBoxes,
      afterSingle: finalSingles,
      notes: historyNotes,
      isFree,
      transaction,
    });

    await transaction.commit();
    return res.status(200).json(stock);
  } catch (error) {
    await transaction.rollback();
    console.error("RESTOCK ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ----------------------------------------------------------------------
// Dedicated endpoint for free stock addition (just a convenience wrapper)
// ----------------------------------------------------------------------
export const addFreeStock = async (req: Request, res: Response) => {
  req.body.isFree = true;
  return restockProduct(req, res);
};

// ----------------------------------------------------------------------
// Delete stock
// ----------------------------------------------------------------------
export const deleteStock = async (req: Request, res: Response) => {
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
      return res.status(404).json({ message: "Not found" });
    }

    await stock.destroy({ transaction });
    await transaction.commit();
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("DELETE STOCK ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ----------------------------------------------------------------------
// Exchange products – recorded in Exchange table only, NOT in StockHistory
// ----------------------------------------------------------------------
export const exchangeProducts = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const { sourceProductId, targetProductId, exchangeType, sourceQuantity, notes } = req.body;
    if (!sourceProductId || !targetProductId) {
      await transaction.rollback();
      return res.status(400).json({ message: "Missing fields" });
    }

    const sourceProduct = await Product.findByPk(sourceProductId, { transaction });
    const targetProduct = await Product.findByPk(targetProductId, { transaction });
    if (!sourceProduct || !targetProduct) {
      await transaction.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    let sourceStock = await Stock.findOne({ where: { productId: sourceProductId }, transaction });
    let targetStock = await Stock.findOne({ where: { productId: targetProductId }, transaction });

    if (!sourceStock) {
      sourceStock = await Stock.create(
        { productId: sourceProductId, boxQuantity: 0, singleQuantity: 0, containerType: ContainerType.BOX },
        { transaction }
      );
    }
    if (!targetStock) {
      targetStock = await Stock.create(
        { productId: targetProductId, boxQuantity: 0, singleQuantity: 0, containerType: ContainerType.BOX },
        { transaction }
      );
    }

    const deduct = exchangeType === "box" ? sourceQuantity * sourceProduct.unitsPerBox : sourceQuantity;
    const sourceTotal = sourceStock.boxQuantity * sourceProduct.unitsPerBox + sourceStock.singleQuantity;
    if (sourceTotal < deduct) {
      await transaction.rollback();
      return res.status(400).json({ message: "Not enough stock" });
    }

    const updatedSource = sourceTotal - deduct;
    const newSourceBoxes = Math.floor(updatedSource / sourceProduct.unitsPerBox);
    const newSourceSingles = updatedSource % sourceProduct.unitsPerBox;

    const targetTotal = targetStock.boxQuantity * targetProduct.unitsPerBox + targetStock.singleQuantity + deduct;
    const newTargetBoxes = Math.floor(targetTotal / targetProduct.unitsPerBox);
    const newTargetSingles = targetTotal % targetProduct.unitsPerBox;

    // NO StockHistory records for exchange

    await sourceStock.update({ boxQuantity: newSourceBoxes, singleQuantity: newSourceSingles }, { transaction });
    await targetStock.update({ boxQuantity: newTargetBoxes, singleQuantity: newTargetSingles }, { transaction });

    await Exchange.create(
      {
        sourceProductId,
        targetProductId,
        exchangeType,
        sourceQuantity,
        targetQuantity: deduct,
        exchangeValue: sourceQuantity,
        notes: notes || null,
      },
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({ message: "Exchange completed" });
  } catch (error) {
    await transaction.rollback();
    console.error("EXCHANGE ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ----------------------------------------------------------------------
// Get exchange history
// ----------------------------------------------------------------------
export const getExchangeHistory = async (_: Request, res: Response) => {
  try {
    const data = await Exchange.findAll({
      include: [
        { model: Product, as: "sourceProduct" },
        { model: Product, as: "targetProduct" },
      ],
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(data);
  } catch (error) {
    console.error("HISTORY ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ----------------------------------------------------------------------
// Get stock history for a product (only INITIAL and RESTOCK now)
// ----------------------------------------------------------------------
export const getStockHistory = async (req: Request, res: Response) => {
  try {
    const productId = getId(req.params.productId);
    if (!productId || !isUUID(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }
    const history = await StockHistory.findAll({
      where: { productId },
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(history);
  } catch (error) {
    console.error("GET STOCK HISTORY ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};