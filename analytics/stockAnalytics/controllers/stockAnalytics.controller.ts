import { Request, Response } from "express";
import { StockAnalyticsService } from "../services/stockAnalytics.service";

const service = new StockAnalyticsService();

export class StockAnalyticsController {
  async getRestockFrequency(req: Request, res: Response) {
    try {
      const data = await service.getRestockFrequencyByCategory();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRestockQuantityDetails(req: Request, res: Response) {
    try {
      const data = await service.getRestockQuantityDetailsByCategory();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}