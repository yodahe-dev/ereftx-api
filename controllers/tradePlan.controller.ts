// controllers/tradePlan.controller.ts
import { Request, Response } from 'express';
import db from '../models';
import { TradePlanSearchService } from '../search/TradePlan.search.service';
import { FilterCondition } from '../search/filter.builder';
import { TradePlanTimeSeriesProcessor } from '../graph/TradePlan.timeSeries.processor';
import { TradePlanDistributionProcessor } from '../graph/TradePlan.distribution.processor';
import { TradePlanAnalyzer } from '../analytics/TradePlan.analyzer';

const { TradePlan } = db;
const searchService = new TradePlanSearchService();

export class TradePlanController {
  // CRUD
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const plan = await TradePlan.create(req.body);
      res.status(201).json({ success: true, data: plan });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async get(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const plan = await TradePlan.findByPk(id as string);
      if (!plan) throw new Error('Plan not found');
      res.json({ success: true, data: plan });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const plan = await TradePlan.findByPk(id as string);
      if (!plan) throw new Error('Plan not found');
      await plan.update(req.body);
      res.json({ success: true, data: plan });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const plan = await TradePlan.findByPk(id as string);
      if (!plan) throw new Error('Plan not found');
      await plan.destroy();
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
      const result = await searchService.searchPlans(filters, page, limit);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Analytics endpoints
  static async getPlanActivity(req: Request, res: Response): Promise<void> {
    try {
      const start = new Date(req.query.start as string);
      const end = new Date(req.query.end as string);
      const data = await TradePlanTimeSeriesProcessor.getPlanActivity(start, end);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getPlanAdherence(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const data = await TradePlanTimeSeriesProcessor.getPlanAdherence(accountId as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getPlanWinRate(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const data = await TradePlanDistributionProcessor.getPlanWinRate(accountId as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getPlanStatusDistribution(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const data = await TradePlanDistributionProcessor.getPlanStatusDistribution(accountId as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getBestPlan(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const data = await TradePlanAnalyzer.getBestPlan(accountId as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getWorstPlan(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const data = await TradePlanAnalyzer.getWorstPlan(accountId as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getAverageDeviation(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const data = await TradePlanAnalyzer.getAverageDeviation(accountId as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}