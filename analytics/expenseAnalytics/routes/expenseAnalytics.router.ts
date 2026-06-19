import { Router } from "express";
import { ExpenseAnalyticsController } from "../controllers/expenseAnalytics.controller";

const router = Router();
const controller = new ExpenseAnalyticsController();

// ── Existing endpoints ──
router.get("/overview", controller.getOverview.bind(controller));
router.get("/monthly-trend", controller.getMonthlyTrend.bind(controller));
router.get("/reference-breakdown", controller.getReferenceBreakdown.bind(controller));
router.get("/daily-trend", controller.getDailyTrend.bind(controller));
router.get("/personal-usage", controller.getPersonalUsage.bind(controller));
router.get("/profit-margin", controller.getProfitMargin.bind(controller));
router.get("/category-spending", controller.getCategorySpending.bind(controller));
router.get("/category-treemap", controller.getCategoryTreemap.bind(controller));
router.get("/plan-expenses", controller.getPlanExpenses.bind(controller));
router.get("/yearly-heatmap", controller.getYearlyHeatmap.bind(controller));

// ── New endpoints ──
router.get("/daily-profit-margin", controller.getDailyProfitMargin.bind(controller));
router.get("/available-years", controller.getAvailableYears.bind(controller));

export default router;