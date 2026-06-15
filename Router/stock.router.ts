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
  updateHistoryPrice,
  getStockPriceLayers,
  assignPriceToStock,
} from "../controllers/stock.controllers";

const router = Router();

// Stock CRUD
router.post("/", createStock);
router.get("/", getStocks);
router.get("/:id", getStockById);
router.put("/:id", updateStock);
router.delete("/:id", deleteStock);

// Stock operations
router.post("/exchange", exchangeProducts);
router.post("/:id/restock", restockProduct);
router.get("/:id/price-layers", getStockPriceLayers);
router.post("/:stockId/assign-price", assignPriceToStock);

// History
router.get("/history/exchanges", getExchangeHistory);
router.get("/history/:productId", getStockHistory);
router.patch("/history/:historyId/price", updateHistoryPrice);

export default router;