// controllers/analytics.controller.ts
import { Request, Response } from 'express';
import { TradeTimeSeriesProcessor } from '../graph/Trade.timeSeries.processor';
import { TradeDistributionProcessor } from '../graph/Trade.distribution.processor';
import { TradeMetricsComputer } from '../analytics/Trade.metrics.computer';
import { TradeSessionAnalyzer } from '../analytics/Trade.session.analyzer';

export class AnalyticsController {
  static async getEquityCurve(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const start = new Date(req.query.start as string);
      const end = new Date(req.query.end as string);
      const interval = (req.query.interval as 'hour' | 'day' | 'week') || 'day';
      const data = await TradeTimeSeriesProcessor.getEquityCurve(accountId as string, start, end, interval);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getDrawdown(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const start = new Date(req.query.start as string);
      const end = new Date(req.query.end as string);
      const data = await TradeTimeSeriesProcessor.getDrawdownSeries(accountId as string, start, end);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getWinLossDistribution(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const data = await TradeDistributionProcessor.getWinLossDistribution(accountId as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getRiskRewardDistribution(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const data = await TradeDistributionProcessor.getRiskRewardDistribution(accountId as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getSharpeRatio(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const sharpe = await TradeMetricsComputer.getSharpeRatio(accountId as string);
      res.json({ success: true, data: sharpe });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getExpectancy(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const expectancy = await TradeMetricsComputer.getExpectancy(accountId as string);
      res.json({ success: true, data: expectancy });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getProfitFactor(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const pf = await TradeMetricsComputer.getProfitFactor(accountId as string);
      res.json({ success: true, data: pf });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getMaxDrawdown(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const maxdd = await TradeMetricsComputer.getMaxDrawdown(accountId as string);
      res.json({ success: true, data: maxdd });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getSessionPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const start = new Date(req.query.start as string);
      const end = new Date(req.query.end as string);
      const data = await TradeSessionAnalyzer.getSessionPerformance(accountId as string, start, end);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getBestSession(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const best = await TradeSessionAnalyzer.getBestSession(accountId as string);
      res.json({ success: true, data: best });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}