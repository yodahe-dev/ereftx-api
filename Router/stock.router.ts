import { Router } from "express";
import {
  createStock,
  getStocks,
  getStockById,
  updateStock,
  deleteStock,
  exchangeProducts,
  getExchangeHistory,
} from "../controllers/stock.controllers";

const router = Router();

router.post("/", createStock);
router.get("/", getStocks);
router.get("/history/exchanges", getExchangeHistory); // NEW
router.get("/:id", getStockById);
router.put("/:id", updateStock);
router.delete("/:id", deleteStock);
router.post("/exchange", exchangeProducts); // NEW

export default router;