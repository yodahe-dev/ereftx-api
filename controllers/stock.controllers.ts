import { Request, Response } from "express";
import { z } from "zod";
import { validate as isUUID } from "uuid";
import db from "../models";
import {
  createStockService,
  restockService,
  updateStockService,
  updateStockHistoryPriceService,
  getStockPriceLayersService,
  assignPriceToStockService,
} from "../service/stock.service";
import { processExchangeService } from "../service/exchange.service";
import {
  createStockSchema,
  updateStockSchema,
  restockSchema,
  exchangeSchema,
  assignPriceToStockSchema,
} from "../validations/stock.schema";

const { Stock, Product, Exchange, StockHistory } = db;

function getId(value: string | string[] | undefined): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

// ========== STOCK CRUD ==========
export const createStock = async (req: Request, res: Response) => {
  try {
    const validated = createStockSchema.parse(req.body);
    const stock = await createStockService(validated);
    return res.status(201).json(stock);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.flatten());
    }
    console.error("CREATE STOCK ERROR:", error);
    return res.status(400).json({ message: error.message || "Internal server error" });
  }
};

export const getStocks = async (_: Request, res: Response) => {
  try {
    const stocks = await Stock.findAll({
      include: [{ model: Product, as: "product" }],
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(stocks);
  } catch (error) {
    console.error("GET STOCKS ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getStockById = async (req: Request, res: Response) => {
  try {
    const id = getId(req.params.id);
    if (!id || !isUUID(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const stock = await Stock.findByPk(id, {
      include: [{ model: Product, as: "product" }],
    });

    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }
    return res.status(200).json(stock);
  } catch (error) {
    console.error("GET STOCK BY ID ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateStock = async (req: Request, res: Response) => {
  try {
    const id = getId(req.params.id);
    if (!id || !isUUID(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const validated = updateStockSchema.parse(req.body);
    const updatedStock = await updateStockService(id, validated);
    return res.status(200).json(updatedStock);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.flatten());
    }
    console.error("UPDATE STOCK ERROR:", error);
    return res.status(400).json({ message: error.message || "Internal server error" });
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

// ========== RESTOCK ==========
export const restockProduct = async (req: Request, res: Response) => {
  try {
    const id = getId(req.params.id);
    if (!id || !isUUID(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const validated = restockSchema.parse(req.body);
    const stock = await restockService(id, validated);
    return res.status(200).json(stock);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.flatten());
    }
    console.error("RESTOCK ERROR:", error);
    return res.status(400).json({ message: error.message || "Internal server error" });
  }
};

// ========== EXCHANGE ==========
export const exchangeProducts = async (req: Request, res: Response) => {
  try {
    const validatedData = exchangeSchema.parse(req.body);
    const result = await processExchangeService(validatedData);
    return res.status(200).json({
      message: "Exchange completed successfully",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.flatten());
    }
    console.error("EXCHANGE ERROR:", error);
    return res.status(400).json({ message: error.message || "Internal server error" });
  }
};

// ========== STOCK HISTORY ==========
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
    console.error("GET HISTORY ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getExchangeHistory = async (_: Request, res: Response) => {
  try {
    const exchanges = await Exchange.findAll({
      include: [
        { model: Product, as: "sourceProduct" },
        { model: Product, as: "targetProduct" },
      ],
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(exchanges);
  } catch (error) {
    console.error("GET EXCHANGE HISTORY ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateHistoryPrice = async (req: Request, res: Response) => {
  try {
    const historyId = getId(req.params.historyId);
    if (!historyId || !isUUID(historyId)) {
      return res.status(400).json({ message: "Invalid historyId" });
    }

    const { priceId } = req.body;
    if (!priceId || !isUUID(priceId)) {
      return res.status(400).json({ message: "Valid priceId is required" });
    }

    const updatedHistory = await updateStockHistoryPriceService(historyId, priceId);
    return res.status(200).json(updatedHistory);
  } catch (error: any) {
    console.error("UPDATE HISTORY PRICE ERROR:", error);
    return res.status(400).json({ message: error.message || "Internal server error" });
  }
};

// ========== STOCK PRICE LAYERS ==========
export const getStockPriceLayers = async (req: Request, res: Response) => {
  try {
    const id = getId(req.params.id);
    if (!id || !isUUID(id)) {
      return res.status(400).json({ message: "Invalid stock ID" });
    }

    const layers = await getStockPriceLayersService(id);
    return res.status(200).json(layers);
  } catch (error: any) {
    console.error("GET STOCK PRICE LAYERS ERROR:", error);
    return res.status(400).json({ message: error.message || "Internal server error" });
  }
};

// ========== ASSIGN PRICE TO PORTION OF STOCK ==========
export const assignPriceToStock = async (req: Request, res: Response) => {
  try {
    const stockId = getId(req.params.stockId);
    if (!stockId || !isUUID(stockId)) {
      return res.status(400).json({ message: "Invalid stockId" });
    }
    const validated = assignPriceToStockSchema.parse(req.body);
    const result = await assignPriceToStockService(stockId, validated);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.flatten());
    }
    console.error("ASSIGN PRICE TO STOCK ERROR:", error);
    return res.status(400).json({ message: error.message || "Internal server error" });
  }
};