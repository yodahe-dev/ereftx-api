import { Router } from "express";
import {
  createStock,
  getStocks,
  getStockById,
  updateStock,
  deleteStock,
  exchangeProducts,
  getExchangeHistory,
  restockProduct,
  getStockHistory,
} from "../controllers/stock.controllers";

const router = Router();

// Static routes first
router.post("/", createStock);
router.get("/", getStocks);

// History & analytics
router.get("/history/exchanges", getExchangeHistory);
router.get("/history/:productId", getStockHistory);

// Stock operations
router.post("/exchange", exchangeProducts);
router.post("/:id/restock", restockProduct);   // <--- FIXED: mount at /:id/restock

// Individual resource (dynamic :id – must come after more specific paths)
router.get("/:id", getStockById);
router.put("/:id", updateStock);
router.delete("/:id", deleteStock);

export default router;