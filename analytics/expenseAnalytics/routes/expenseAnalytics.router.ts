import { Router } from "express";
import { ExpenseAnalyticsController } from "../controllers/expenseAnalytics.controller";

const router = Router();
const controller = new ExpenseAnalyticsController();

// ── KPI Cards ──
router.get("/overview", controller.getOverview.bind(controller));

// ── Monthly Trends ──
router.get("/monthly-trend", controller.getMonthlyTrend.bind(controller));

// ── Expense Breakdown by Reference Type (Stacked Bar) ──
router.get("/expense-breakdown", controller.getExpenseBreakdown.bind(controller));

// ── Expense Category Treemap ──
router.get("/category-treemap", controller.getCategoryTreemap.bind(controller));

// ── Budget Plan Progress ──
router.get("/budget-progress", controller.getBudgetProgress.bind(controller));

// ── Cash Flow (Paid vs Pending Invoices) ──
router.get("/cash-flow", controller.getCashFlow.bind(controller));

// ── Payment Type Distribution ──
router.get("/payment-type", controller.getPaymentTypeDistribution.bind(controller));

// ── Personal vs Business Expenses ──
router.get("/personal-vs-business", controller.getPersonalVsBusiness.bind(controller));

// ── Burn Rate (Fixed vs Variable) ──
router.get("/burn-rate", controller.getBurnRate.bind(controller));

// ── Runway Projection ──
router.get("/runway", controller.getRunway.bind(controller));

// ── Calendar Heatmap (monthly) ──
router.get("/heatmap", controller.getHeatmap.bind(controller));

// ── Daily Net Profit ──
router.get("/daily-net-profit", controller.getDailyNetProfit.bind(controller));

// ── Cumulative Profit ──
router.get("/cumulative-profit", controller.getCumulativeProfit.bind(controller));

// ── Weekly Aggregates ──
router.get("/weekly-aggregates", controller.getWeeklyAggregates.bind(controller));

// ── Category Spending (flat) ──
router.get("/category-spending", controller.getCategorySpending.bind(controller));

// ── Reference Type Summary ──
router.get("/reference-type-summary", controller.getReferenceTypeSummary.bind(controller));

// ── Yearly Heatmap ──
router.get("/yearly-heatmap", controller.getYearlyHeatmap.bind(controller));

// ── Profit Margin (overall) ──
router.get("/profit-margin", controller.getProfitMargin.bind(controller));

// ── NEW: Personal Usage Summary (monthly) ──
router.get("/personal-usage-summary", controller.getPersonalUsageSummary.bind(controller));

// ── NEW: Personal Usage Total (all-time) ──
router.get("/personal-usage-total", controller.getPersonalUsageTotal.bind(controller));

export default router;