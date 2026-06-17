import { Router } from "express";
import { SalesAnalyticsController } from "../controllers/salesAnalytics.controller";

const router = Router();
const controller = new SalesAnalyticsController();

router.get("/sales-summary", controller.getSalesSummary.bind(controller));
router.get("/unit-type-breakdown", controller.getUnitTypeBreakdown.bind(controller));
router.get("/quadrant-heatmap", controller.getQuadrantHeatmap.bind(controller));
router.get("/cost-vs-retail", controller.getCostVsRetail.bind(controller));
router.get("/daily-profit", controller.getDailyProfit.bind(controller));
router.get("/daily-sales-frequency", controller.getDailySalesFrequency.bind(controller));
router.get("/daily-quantity-sold", controller.getDailyQuantitySold.bind(controller));
router.get("/top-selling", controller.getTopSellingProducts.bind(controller));
router.get("/top-profit", controller.getTopProfitProducts.bind(controller));
router.get("/revenue-profit-margin", controller.getRevenueProfitMargin.bind(controller));

export default router;