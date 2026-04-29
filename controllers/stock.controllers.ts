import { Request, Response } from "express";
import { z } from "zod";
import { validate as isUUID } from "uuid";
import db from "../models";
import { 
  createStockService, 
  restockService, 
  updateStockService 
} from "../service/stock.service";
import { processExchangeService } from "../service/exchange.service";
import { exchangeSchema } from "../validations/stock.schema";

const { Stock, Product, Exchange, StockHistory } = db;

// ---------- Helper: Extract string ID from params ----------
function getId(value: string | string[] | undefined): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

// ---------- Controllers ----------

export const createStock = async (req: Request, res: Response) => {
  try {
    // Service handles the transaction and StockHistory (with priceId)
    const stock = await createStockService(req.body);
    return res.status(201).json(stock);
  } catch (error: any) {
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

    // Service handles units math and History record with priceId
    const updatedStock = await updateStockService(id, req.body);
    return res.status(200).json(updatedStock);
  } catch (error: any) {
    console.error("UPDATE STOCK ERROR:", error);
    return res.status(400).json({ message: error.message || "Internal server error" });
  }
};

export const restockProduct = async (req: Request, res: Response) => {
  try {
    const id = getId(req.params.id);
    if (!id || !isUUID(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    // Service handles adding quantities and History record
    const stock = await restockService(id, req.body);
    return res.status(200).json(stock);
  } catch (error: any) {
    console.error("RESTOCK ERROR:", error);
    return res.status(400).json({ message: error.message || "Internal server error" });
  }
};

export const exchangeProducts = async (req: Request, res: Response) => {
  try {
    // Validate request body using the Zod schema
    const validatedData = exchangeSchema.parse(req.body);

    // Service handles the complex dual-product transaction & ledger
    const result = await processExchangeService(validatedData);

    return res.status(200).json({ 
      message: "Exchange completed successfully",
      data: result 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.flatten());
    }
    console.error("EXCHANGE ERROR:", error);
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