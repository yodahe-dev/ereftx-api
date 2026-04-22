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

router.post("/", createStock);
router.get("/", getStocks);
router.get("/history/exchanges", getExchangeHistory);
router.post("/exchange", exchangeProducts);

// Stock history endpoint
router.get("/history/:productId", getStockHistory);

// Restock endpoint
router.post("/:id/restock", restockProduct);

router.get("/:id", getStockById);
router.put("/:id", updateStock);
router.delete("/:id", deleteStock);

export default router;