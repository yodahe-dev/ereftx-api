import { Request, Response } from "express";
import { StockAnalyticsService } from "../services/stockAnalytics.service";

const service = new StockAnalyticsService();

export class StockAnalyticsController {
  // Category endpoints (existing)
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

  // Product-level endpoints (new)
  async getProductRestockDetails(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const data = await service.getRestockDetailsByProduct(productId as string);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getProductSalesVelocity(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const data = await service.getSalesVelocityByProduct(productId as string);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getProductCurrentStock(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const data = await service.getCurrentStockByProduct(productId as string);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getProductStockLevelHistory(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const data = await service.getStockLevelHistoryByProduct(productId as string);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getFullProductAnalytics(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const data = await service.getFullProductAnalytics(productId as string);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}