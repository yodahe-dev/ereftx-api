import { Router } from "express";
import {
  createStock,
  getStocks,
  getStockById,
  updateStock,
  deleteStock,
  exchangeProducts, // This now uses the processExchangeService refactor
  getExchangeHistory,
  restockProduct,
  getStockHistory,
} from "../controllers/stock.controllers"; // Note: Check if your filename is controller or controllers (singular is standard)

const router = Router();

/**
 * @section Core CRUD
 */
router.post("/", createStock);
router.get("/", getStocks);

/**
 * @section History & Analytics
 * IMPORTANT: Static paths like /history/... must come BEFORE dynamic paths like /:id
 * otherwise Express will think "history" is a product ID.
 */
router.get("/history/exchanges", getExchangeHistory);
router.get("/history/:productId", getStockHistory);

/**
 * @section Stock Operations
 */
router.post("/exchange", exchangeProducts);
router.post("/restock", restockProduct); // Refactored to handle body data rather than just ID

/**
 * @section Individual Resource
 */
router.get("/:id", getStockById);
router.put("/:id", updateStock);
router.delete("/:id", deleteStock);

export default router;