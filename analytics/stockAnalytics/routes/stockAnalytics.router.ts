import { Router } from "express";
import { StockAnalyticsController } from "../controllers/stockAnalytics.controller";

const router = Router();
const controller = new StockAnalyticsController();

// Category routes
router.get("/restock-frequency", controller.getRestockFrequency.bind(controller));
router.get("/restock-quantity-details", controller.getRestockQuantityDetails.bind(controller));

// Product routes
router.get("/product/:productId/restock-details", controller.getProductRestockDetails.bind(controller));
router.get("/product/:productId/sales-velocity", controller.getProductSalesVelocity.bind(controller));
router.get("/product/:productId/current-stock", controller.getProductCurrentStock.bind(controller));
router.get("/product/:productId/stock-level-history", controller.getProductStockLevelHistory.bind(controller));
router.get("/product/:productId/full", controller.getFullProductAnalytics.bind(controller));

export default router;