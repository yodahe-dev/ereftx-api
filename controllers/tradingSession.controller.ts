// controllers/tradingSession.controller.ts
import { Request, Response } from 'express';
import db from '../models';
import { TradingSessionSearchService } from '../search/TradingSession.search.service';
import { FilterCondition } from '../search/filter.builder';
import { TradingSessionTimeSeriesProcessor } from '../graph/TradingSession.timeSeries.processor';
import { TradingSessionDistributionProcessor } from '../graph/TradingSession.distribution.processor';
import { TradingSessionAnalyzer } from '../analytics/TradingSession.analyzer';
import { TradingSessionUpdater } from '../jobs/TradingSession.updater';

const { TradingSession } = db;
const searchService = new TradingSessionSearchService();

export class TradingSessionController {
  // CRUD
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const session = await TradingSession.create(req.body);
      res.status(201).json({ success: true, data: session });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async get(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const session = await TradingSession.findByPk(id as string);
      if (!session) throw new Error('Session not found');
      res.json({ success: true, data: session });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const session = await TradingSession.findByPk(id as string);
      if (!session) throw new Error('Session not found');
      await session.update(req.body);
      res.json({ success: true, data: session });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const session = await TradingSession.findByPk(id as string);
      if (!session) throw new Error('Session not found');
      await session.destroy();
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async list(req: Request, res: Response): Promise<void> {
    try {
      const filters: FilterCondition[] = req.body.filters || [];
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await searchService.searchSessions(filters, page, limit);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Analytics endpoints
  static async getTradeVolumePerSession(req: Request, res: Response): Promise<void> {
    try {
      const start = new Date(req.query.start as string);
      const end = new Date(req.query.end as string);
      const data = await TradingSessionTimeSeriesProcessor.getTradeVolumePerSession(start, end);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getPnLPerSession(req: Request, res: Response): Promise<void> {
    try {
      const start = new Date(req.query.start as string);
      const end = new Date(req.query.end as string);
      const data = await TradingSessionTimeSeriesProcessor.getPnLPerSession(start, end);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getWinRatePerSession(req: Request, res: Response): Promise<void> {
    try {
      const data = await TradingSessionDistributionProcessor.getWinRatePerSession();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getProfitFactorPerSession(req: Request, res: Response): Promise<void> {
    try {
      const data = await TradingSessionDistributionProcessor.getProfitFactorPerSession();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getBestSession(req: Request, res: Response): Promise<void> {
    try {
      const data = await TradingSessionAnalyzer.getBestSessionByProfitFactor();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getWorstSession(req: Request, res: Response): Promise<void> {
    try {
      const data = await TradingSessionAnalyzer.getWorstSessionByWinRate();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getSessionTrend(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const weeks = parseInt(req.query.weeks as string) || 4;
      const data = await TradingSessionAnalyzer.getSessionTrend(sessionId as string, weeks);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async compareSessions(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId1, sessionId2 } = req.params;
      const data = await TradingSessionAnalyzer.compareSessions(sessionId1 as string, sessionId2 as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateSessionBoundaries(req: Request, res: Response): Promise<void> {
    try {
      await TradingSessionUpdater.updateTodaySchedule();
      res.json({ success: true, message: 'Session boundaries updated' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}