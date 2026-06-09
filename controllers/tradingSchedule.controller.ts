// controllers/tradingSchedule.controller.ts
import { Request, Response } from 'express';
import db from '../models';
import { TradingScheduleSearchService } from '../search/TradingSchedule.search.service';
import { FilterCondition } from '../search/filter.builder';
import { TradingScheduleTimeSeriesProcessor } from '../graph/TradingSchedule.timeSeries.processor';
import { TradingScheduleAnalyzer } from '../analytics/TradingSchedule.analyzer';

const { UserTradingSchedule } = db;
const searchService = new TradingScheduleSearchService();

export class TradingScheduleController {
  // CRUD
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const schedule = await UserTradingSchedule.create(req.body);
      res.status(201).json({ success: true, data: schedule });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async get(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schedule = await UserTradingSchedule.findByPk(id as string);
      if (!schedule) throw new Error('Schedule not found');
      res.json({ success: true, data: schedule });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schedule = await UserTradingSchedule.findByPk(id as string);
      if (!schedule) throw new Error('Schedule not found');
      await schedule.update(req.body);
      res.json({ success: true, data: schedule });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schedule = await UserTradingSchedule.findByPk(id as string);
      if (!schedule) throw new Error('Schedule not found');
      await schedule.destroy();
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
      const result = await searchService.searchSchedules(filters, page, limit);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getActiveForDay(req: Request, res: Response): Promise<void> {
    try {
      const day = parseInt(req.params.day as string);
      const schedule = await searchService.getActiveScheduleForDay(day);
      res.json({ success: true, data: schedule });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Analytics endpoints
  static async getAdherence(req: Request, res: Response): Promise<void> {
    try {
      const start = new Date(req.query.start as string);
      const end = new Date(req.query.end as string);
      const data = await TradingScheduleTimeSeriesProcessor.getScheduleAdherence(start, end);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getEffectiveness(req: Request, res: Response): Promise<void> {
    try {
      const data = await TradingScheduleAnalyzer.getScheduleEffectiveness();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getBestDay(req: Request, res: Response): Promise<void> {
    try {
      const data = await TradingScheduleAnalyzer.getBestScheduleDay();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}