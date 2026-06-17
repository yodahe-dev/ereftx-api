import { Request, Response } from "express";
import { SalesAnalyticsService } from "../services/salesAnalytics.service";

const service = new SalesAnalyticsService();

export class SalesAnalyticsController {
  async getSalesSummary(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getSalesSummary(startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUnitTypeBreakdown(req: Request, res: Response) {
    try {
      const { groupBy = 'product' } = req.query;
      const data = await service.getUnitTypeBreakdown(groupBy as 'product' | 'brand');
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getQuadrantHeatmap(req: Request, res: Response) {
    try {
      const data = await service.getQuadrantHeatmap();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCostVsRetail(req: Request, res: Response) {
    try {
      const { productId } = req.query;
      const data = await service.getCostVsRetail(productId as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDailyProfit(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getDailyProfit(startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDailySalesFrequency(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getDailySalesFrequency(startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDailyQuantitySold(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getDailyQuantitySold(startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTopSellingProducts(req: Request, res: Response) {
    try {
      const { startDate, endDate, limit = 10 } = req.query;
      const data = await service.getTopSellingProducts(
        startDate as string,
        endDate as string,
        Number(limit)
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTopProfitProducts(req: Request, res: Response) {
    try {
      const { startDate, endDate, limit = 10 } = req.query;
      const data = await service.getTopProfitProducts(
        startDate as string,
        endDate as string,
        Number(limit)
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRevenueProfitMargin(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await service.getRevenueProfitMargin(startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}