// controllers/stockController.ts
import db from "../models";
import { Request, Response } from "express";
import { validate as isUUID } from "uuid";
import { Transaction } from "sequelize";
import { ContainerType } from "../models/Stock";

const { Stock, Product, Exchange, sequelize } = db;

const DEFAULT_CONTAINER_TYPE: ContainerType = ContainerType.BOX;

const getId = (id: string | string[] | undefined): string | null => {
  if (!id) return null;
  if (Array.isArray(id)) return id[0] ?? null;
  return id;
};

// Helper: Normalize stock (convert singles to boxes)
const normalizeStock = (stock: any, product: any) => {
  const bottlesPerBox = product.bottlesPerBox;
  const totalSingles = stock.boxQuantity * bottlesPerBox + stock.singleQuantity;
  const newBoxes = Math.floor(totalSingles / bottlesPerBox);
  const newSingles = totalSingles % bottlesPerBox;
  return { boxQuantity: newBoxes, singleQuantity: newSingles };
};

// CREATE STOCK
export const createStock = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { productId, boxQuantity, singleQuantity, containerType } = req.body;
    if (!productId || !isUUID(productId)) return res.status(400).json({ message: "Invalid productId" });
    if (typeof boxQuantity !== "number" || boxQuantity < 0) return res.status(400).json({ message: "Invalid boxQuantity" });
    if (typeof singleQuantity !== "number" || singleQuantity < 0) return res.status(400).json({ message: "Invalid singleQuantity" });

    const safeContainerType = containerType && Object.values(ContainerType).includes(containerType) ? containerType : DEFAULT_CONTAINER_TYPE;
    const stock = await Stock.create({ productId, boxQuantity, singleQuantity, containerType: safeContainerType });
    return res.status(201).json(stock);
  } catch (error) {
    console.error("CREATE STOCK ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET ALL STOCKS (with product details)
export const getStocks = async (_: Request, res: Response): Promise<Response> => {
  try {
    const stocks = await Stock.findAll({
      include: [{ model: Product, as: "product", attributes: ["id", "name", "sku", "bottlesPerBox", "boxBuyPrice", "boxSellPrice", "singleSellPrice", "isActive"] }],
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(stocks);
  } catch (error) {
    console.error("GET STOCK ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET STOCK BY ID
export const getStockById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = getId(req.params.id);
    if (!id || !isUUID(id)) return res.status(400).json({ message: "Invalid ID format" });
    const stock = await Stock.findByPk(id, { include: [{ model: Product, as: "product" }] });
    if (!stock) return res.status(404).json({ message: "Not found" });
    return res.status(200).json(stock);
  } catch (error) {
    console.error("GET STOCK BY ID ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// UPDATE STOCK (with normalization)
export const updateStock = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = getId(req.params.id);
    if (!id || !isUUID(id)) return res.status(400).json({ message: "Invalid ID format" });
    const stock = await Stock.findByPk(id);
    if (!stock) return res.status(404).json({ message: "Not found" });

    const { boxQuantity, singleQuantity, containerType } = req.body;
    const product = await Product.findByPk(stock.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let newBoxes = typeof boxQuantity === "number" && boxQuantity >= 0 ? boxQuantity : stock.boxQuantity;
    let newSingles = typeof singleQuantity === "number" && singleQuantity >= 0 ? singleQuantity : stock.singleQuantity;

    // Normalize: convert singles to boxes
    const totalSingles = newBoxes * product.bottlesPerBox + newSingles;
    const finalBoxes = Math.floor(totalSingles / product.bottlesPerBox);
    const finalSingles = totalSingles % product.bottlesPerBox;

    const updatePayload: any = {
      boxQuantity: finalBoxes,
      singleQuantity: finalSingles,
    };
    if (containerType && Object.values(ContainerType).includes(containerType)) {
      updatePayload.containerType = containerType;
    }

    await stock.update(updatePayload);
    return res.status(200).json(stock);
  } catch (error) {
    console.error("UPDATE STOCK ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE STOCK
export const deleteStock = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = getId(req.params.id);
    if (!id || !isUUID(id)) return res.status(400).json({ message: "Invalid ID format" });
    const stock = await Stock.findByPk(id);
    if (!stock) return res.status(404).json({ message: "Not found" });
    await stock.destroy();
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("DELETE STOCK ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// NORMALIZE STOCK (convert all singles to boxes)
export const normalizeStockByProduct = async (req: Request, res: Response): Promise<Response> => {
  try {
    const productId = getId(req.params.productId);
    if (!productId || !isUUID(productId)) return res.status(400).json({ message: "Invalid productId" });

    const stock = await Stock.findOne({ where: { productId } });
    if (!stock) return res.status(404).json({ message: "Stock not found" });

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const totalSingles = stock.boxQuantity * product.bottlesPerBox + stock.singleQuantity;
    const newBoxes = Math.floor(totalSingles / product.bottlesPerBox);
    const newSingles = totalSingles % product.bottlesPerBox;

    await stock.update({ boxQuantity: newBoxes, singleQuantity: newSingles });
    return res.status(200).json({ message: "Stock normalized", boxQuantity: newBoxes, singleQuantity: newSingles });
  } catch (error) {
    console.error("NORMALIZE STOCK ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// EXCHANGE PRODUCTS (fixed)
export const exchangeProducts = async (req: Request, res: Response): Promise<Response> => {
  const transaction: Transaction = await sequelize.transaction();
  try {
    const { sourceProductId, targetProductId, exchangeType, sourceQuantity, notes } = req.body;
    if (!sourceProductId || !targetProductId || !exchangeType || !sourceQuantity) {
      await transaction.rollback();
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!isUUID(sourceProductId) || !isUUID(targetProductId)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid product ID format" });
    }
    if (sourceQuantity <= 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Quantity must be > 0" });
    }
    if (sourceProductId === targetProductId) {
      await transaction.rollback();
      return res.status(400).json({ message: "Cannot exchange same product" });
    }

    const sourceProduct = await Product.findByPk(sourceProductId, { transaction });
    const targetProduct = await Product.findByPk(targetProductId, { transaction });
    if (!sourceProduct || !targetProduct) {
      await transaction.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    let sourceStock = await Stock.findOne({ where: { productId: sourceProductId }, transaction, lock: true });
    let targetStock = await Stock.findOne({ where: { productId: targetProductId }, transaction, lock: true });

    if (!sourceStock) {
      sourceStock = await Stock.create({ productId: sourceProductId, boxQuantity: 0, singleQuantity: 0, containerType: ContainerType.BOX }, { transaction });
    }
    if (!targetStock) {
      targetStock = await Stock.create({ productId: targetProductId, boxQuantity: 0, singleQuantity: 0, containerType: ContainerType.BOX }, { transaction });
    }

    // Calculate singles to deduct from source
    const deductSingles = exchangeType === "box" ? sourceQuantity * sourceProduct.bottlesPerBox : sourceQuantity;

    // Check source has enough singles
    const sourceTotalSingles = sourceStock.boxQuantity * sourceProduct.bottlesPerBox + sourceStock.singleQuantity;
    if (sourceTotalSingles < deductSingles) {
      await transaction.rollback();
      return res.status(400).json({ message: "Insufficient stock in source product" });
    }

    // Deduct from source (singles first, then boxes)
    let remainingDeduct = deductSingles;
    let newSourceSingles = sourceStock.singleQuantity;
    let newSourceBoxes = sourceStock.boxQuantity;

    // Deduct from singles first
    const deductFromSingles = Math.min(remainingDeduct, newSourceSingles);
    newSourceSingles -= deductFromSingles;
    remainingDeduct -= deductFromSingles;

    // Deduct from boxes if still needed
    if (remainingDeduct > 0) {
      const deductFromBoxes = Math.ceil(remainingDeduct / sourceProduct.bottlesPerBox);
      newSourceBoxes -= deductFromBoxes;
      // After removing boxes, adjust singles (the last box may be partially taken)
      const newTotalSingles = newSourceBoxes * sourceProduct.bottlesPerBox + newSourceSingles;
      // Ensure no negative
      if (newTotalSingles < 0) {
        await transaction.rollback();
        return res.status(400).json({ message: "Stock became negative during exchange" });
      }
      // Re-normalize source after deduction
      const newTotal = newSourceBoxes * sourceProduct.bottlesPerBox + newSourceSingles;
      newSourceBoxes = Math.floor(newTotal / sourceProduct.bottlesPerBox);
      newSourceSingles = newTotal % sourceProduct.bottlesPerBox;
    }

    // Add to target (in singles, then convert to boxes)
    const targetTotalSingles = targetStock.boxQuantity * targetProduct.bottlesPerBox + targetStock.singleQuantity + deductSingles;
    const newTargetBoxes = Math.floor(targetTotalSingles / targetProduct.bottlesPerBox);
    const newTargetSingles = targetTotalSingles % targetProduct.bottlesPerBox;

    // Apply updates
    await sourceStock.update({ boxQuantity: newSourceBoxes, singleQuantity: newSourceSingles }, { transaction });
    await targetStock.update({ boxQuantity: newTargetBoxes, singleQuantity: newTargetSingles }, { transaction });

    // Log exchange with accurate quantities
    const sourceGivenBoxes = sourceStock.boxQuantity - newSourceBoxes;
    const sourceGivenSingles = sourceStock.singleQuantity - newSourceSingles;
    const targetReceivedBoxes = newTargetBoxes - (targetStock?.boxQuantity || 0);
    const targetReceivedSingles = newTargetSingles - (targetStock?.singleQuantity || 0);

    await Exchange.create({
      sourceProductId,
      targetProductId,
      exchangeType,
      exchangeValue: sourceQuantity,
      sourceQuantityBoxes: Math.max(0, sourceGivenBoxes),
      sourceQuantitySingles: Math.max(0, sourceGivenSingles),
      targetQuantityBoxes: Math.max(0, targetReceivedBoxes),
      targetQuantitySingles: Math.max(0, targetReceivedSingles),
      notes: notes || null,
    }, { transaction });

    await transaction.commit();
    return res.status(200).json({ message: "Exchange completed successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("EXCHANGE ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET EXCHANGE HISTORY
export const getExchangeHistory = async (_: Request, res: Response): Promise<Response> => {
  try {
    const exchanges = await Exchange.findAll({
      include: [
        { model: Product, as: "sourceProduct", attributes: ["id", "name", "sku"] },
        { model: Product, as: "targetProduct", attributes: ["id", "name", "sku"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(exchanges);
  } catch (error) {
    console.error("GET EXCHANGE HISTORY ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};