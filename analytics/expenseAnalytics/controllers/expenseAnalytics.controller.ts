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
      const { period } = req.query;
      const data = await service.getMonthlyTrend(period as string);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getMonthlyTrend error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getReferenceBreakdown(req: Request, res: Response) {
    try {
      const data = await service.getReferenceBreakdown();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getReferenceBreakdown error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDailyTrend(req: Request, res: Response) {
    try {
      const data = await service.getDailyTrend();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getDailyTrend error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPersonalUsage(req: Request, res: Response) {
    try {
      const data = await service.getPersonalUsage();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getPersonalUsage error:", error);
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

  async getCategorySpending(req: Request, res: Response) {
    try {
      const data = await service.getCategorySpending();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getCategorySpending error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCategoryTreemap(req: Request, res: Response) {
    try {
      const data = await service.getCategoryTreemap();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getCategoryTreemap error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPlanExpenses(req: Request, res: Response) {
    try {
      const data = await service.getPlanExpenses();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getPlanExpenses error:", error);
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

  // ── New: Daily Profit Margin ──
  async getDailyProfitMargin(req: Request, res: Response) {
    try {
      const data = await service.getDailyProfitMargin();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getDailyProfitMargin error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ── New: Available Years ──
  async getAvailableYears(req: Request, res: Response) {
    try {
      const data = await service.getAvailableYears();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("getAvailableYears error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}