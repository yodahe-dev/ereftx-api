import { Router } from "express";
import analyticsController from "../modules/stocks/analytics/analytics.controllers";

const router = Router();

router.get("/sales", analyticsController.getSalesAnalytics);
router.get("/stock-movement", analyticsController.getStockMovement);
router.get("/top-products", analyticsController.getTopProducts);
router.get("/dashboard-summary", analyticsController.getDashboardSummary);

export default router;