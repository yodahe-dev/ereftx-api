import { Request, Response } from "express";
import { z } from "zod";
import analyticsService from "./analytics.service";
import { salesAnalyticsSchema, stockMovementSchema, topProductsSchema } from "./analytics.schema";

export class AnalyticsController {
  async getSalesAnalytics(req: Request, res: Response) {
    try {
      const validated = salesAnalyticsSchema.parse(req.query);
      const data = await analyticsService.getSalesAnalytics(validated);
      res.json({ success: true, data });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json(error.flatten());
      res.status(500).json({ message: error.message });
    }
  }

  async getStockMovement(req: Request, res: Response) {
    try {
      const validated = stockMovementSchema.parse(req.query);
      const data = await analyticsService.getStockMovement(validated);
      res.json({ success: true, data });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json(error.flatten());
      res.status(500).json({ message: error.message });
    }
  }

  async getTopProducts(req: Request, res: Response) {
    try {
      const validated = topProductsSchema.parse(req.query);
      const data = await analyticsService.getTopProducts(validated);
      res.json({ success: true, data });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json(error.flatten());
      res.status(500).json({ message: error.message });
    }
  }

  async getDashboardSummary(req: Request, res: Response) {
    try {
      const data = await analyticsService.getDashboardSummary();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default new AnalyticsController();