// controllers/sessionPerformance.controller.ts
import { Request, Response } from 'express';
import db from '../models';
import { SessionPerformanceSearchService } from '../search/SessionPerformance.search.service';
import { FilterCondition } from '../search/filter.builder';
import { SessionPerformanceTimeSeriesProcessor } from '../graph/SessionPerformance.timeSeries.processor';
import { SessionPerformanceDistributionProcessor } from '../graph/SessionPerformance.distribution.processor';
import { SessionPerformanceAnalyzer } from '../analytics/SessionPerformance.analyzer';

const { SessionPerformance } = db;
const searchService = new SessionPerformanceSearchService();

export class SessionPerformanceController {
  // CRUD - read-only (updates are done via background job)
  static async get(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const perf = await SessionPerformance.findByPk(id as string, {
        include: [{ model: db.TradingSession, as: 'session' }],
      });
      if (!perf) throw new Error('Performance record not found');
      res.json({ success: true, data: perf });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  static async list(req: Request, res: Response): Promise<void> {
    try {
      const filters: FilterCondition[] = req.body.filters || [];
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await searchService.searchPerformance(filters, page, limit);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getBySessionAndDate(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, date } = req.params;
      const perf = await searchService.getBySessionAndDate(sessionId as string, new Date(date as string));
      if (!perf) throw new Error('Performance record not found');
      res.json({ success: true, data: perf });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  // Analytics endpoints
  static async getWinRateTrend(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const start = new Date(req.query.start as string);
      const end = new Date(req.query.end as string);
      const data = await SessionPerformanceTimeSeriesProcessor.getWinRateTrend(sessionId as string, start, end);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getProfitFactorTrend(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const start = new Date(req.query.start as string);
      const end = new Date(req.query.end as string);
      const data = await SessionPerformanceTimeSeriesProcessor.getProfitFactorTrend(sessionId as string, start, end);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getNetProfitComparison(req: Request, res: Response): Promise<void> {
    try {
      const start = new Date(req.query.start as string);
      const end = new Date(req.query.end as string);
      const data = await SessionPerformanceTimeSeriesProcessor.getNetProfitComparison(start, end);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getAverageWinRatePerSession(req: Request, res: Response): Promise<void> {
    try {
      const data = await SessionPerformanceDistributionProcessor.getAverageWinRatePerSession();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getBestSessionByProfitFactor(req: Request, res: Response): Promise<void> {
    try {
      const data = await SessionPerformanceDistributionProcessor.getBestSessionByProfitFactor();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getSessionSummary(req: Request, res: Response): Promise<void> {
    try {
      const start = new Date(req.query.start as string);
      const end = new Date(req.query.end as string);
      const data = await SessionPerformanceAnalyzer.getSessionSummary(start, end);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getUnderperformingSessions(req: Request, res: Response): Promise<void> {
    try {
      const data = await SessionPerformanceAnalyzer.getUnderperformingSessions();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}