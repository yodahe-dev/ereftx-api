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
  getProductPrices,      // new
  getStockPriceLayers,   // new
} from "../controllers/stock.controllers";

const router = Router();

// Static routes
router.post("/", createStock);
router.get("/", getStocks);

// Price management (must come before /:id)
router.get("/prices", getProductPrices);           // list/filter prices
router.get("/:id/price-layers", getStockPriceLayers); // breakdown of stock by price

// History & analytics
router.get("/history/exchanges", getExchangeHistory);
router.get("/history/:productId", getStockHistory);
router.patch("/history/:historyId/price", updateHistoryPrice);

// Stock operations
router.post("/exchange", exchangeProducts);
router.post("/:id/restock", restockProduct);

// Individual resource (must be after specific paths)
router.get("/:id", getStockById);
router.put("/:id", updateStock);
router.delete("/:id", deleteStock);

export default router;