import { Request, Response } from "express";
import { ExpenseAnalyticsService } from "../services/expenseAnalytics.service";

const service = new ExpenseAnalyticsService();

export class ExpenseAnalyticsController {
  async getOverview(req: Request, res: Response) {
    try {
      const data = await service.getOverview();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getOverview error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMonthlyTrend(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getMonthlyTrend(startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getMonthlyTrend error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getExpenseBreakdown(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getExpenseBreakdown(startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getExpenseBreakdown error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCategoryTreemap(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getCategoryTreemap(startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getCategoryTreemap error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getBudgetProgress(req: Request, res: Response) {
    try {
      const data = await service.getBudgetProgress();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getBudgetProgress error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCashFlow(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getCashFlow(startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getCashFlow error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPaymentTypeDistribution(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getPaymentTypeDistribution(startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getPaymentTypeDistribution error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPersonalVsBusiness(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getPersonalVsBusiness(startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getPersonalVsBusiness error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getBurnRate(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getBurnRate(startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getBurnRate error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRunway(req: Request, res: Response) {
    try {
      const data = await service.getRunway();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getRunway error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getHeatmap(req: Request, res: Response) {
    try {
      const { year, month } = req.query;
      const data = await service.getHeatmap(
        year ? parseInt(year as string) : undefined,
        month ? parseInt(month as string) : undefined
      );
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getHeatmap error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDailyNetProfit(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getDailyNetProfit(startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getDailyNetProfit error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCumulativeProfit(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getCumulativeProfit(startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getCumulativeProfit error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getWeeklyAggregates(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getWeeklyAggregates(startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getWeeklyAggregates error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCategorySpending(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getCategorySpending(startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getCategorySpending error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getReferenceTypeSummary(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getReferenceTypeSummary(startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getReferenceTypeSummary error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getYearlyHeatmap(req: Request, res: Response) {
    try {
      const { year } = req.query;
      const data = await service.getYearlyHeatmap(
        year ? parseInt(year as string) : new Date().getFullYear()
      );
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getYearlyHeatmap error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getProfitMargin(req: Request, res: Response) {
    try {
      const data = await service.getProfitMargin();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getProfitMargin error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
    async getPersonalUsageSummary(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getPersonalUsageSummary(
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getPersonalUsageSummary error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ── Personal Usage Total (all-time) ──
  async getPersonalUsageTotal(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getPersonalUsageTotal(
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getPersonalUsageTotal error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

