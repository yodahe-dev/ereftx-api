// controllers/tradingAccount.controller.ts
import { Request, Response } from 'express';
import db from '../models';
import { TradingAccountSearchService } from '../search/TradingAccount.search.service';
import { FilterCondition } from '../search/filter.builder';
import { TradingAccountTimeSeriesProcessor } from '../graph/TradingAccount.timeSeries.processor';
import { TradingAccountDistributionProcessor } from '../graph/TradingAccount.distribution.processor';
import { TradingAccountMetricsComputer } from '../analytics/TradingAccount.metrics.computer';

const { TradingAccount } = db;
const searchService = new TradingAccountSearchService();
searchService.init();

export class TradingAccountController {
  // CRUD
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const account = await TradingAccount.create(req.body);
      res.status(201).json({ success: true, data: account });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async get(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const account = await TradingAccount.findByPk(id as string);
      if (!account) throw new Error('Account not found');
      res.json({ success: true, data: account });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const account = await TradingAccount.findByPk(id as string);
      if (!account) throw new Error('Account not found');
      await account.update(req.body);
      res.json({ success: true, data: account });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

static async delete(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const account = await TradingAccount.findByPk(id as string);

    if (!account) {
      res.status(404).json({
        success: false,
        message: 'Account not found',
      });
      return;
    }

    await account.destroy({ force: true }); // hard delete

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

static async list(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    
    // Build filters from search term
    const filters: FilterCondition[] = [];
    if (search) {
      filters.push({ field: 'name', operator: 'contains', value: search });
    }
    
    const result = await searchService.searchAccounts(filters, page, limit);
    res.json({ success: true, rows: result.rows, total: result.total, page, limit });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

  static async autoCompleteName(req: Request, res: Response): Promise<void> {
    try {
      const prefix = req.query.prefix as string;
      const names = await searchService.autoCompleteName(prefix);
      res.json({ success: true, data: names });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Analytics endpoints
  static async getEquityCurve(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const start = new Date(req.query.start as string);
      const end = new Date(req.query.end as string);
      const interval = (req.query.interval as 'hour' | 'day' | 'week') || 'day';
      const data = await TradingAccountTimeSeriesProcessor.getEquityCurve(accountId as string, start, end, interval);
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
      const data = await TradingAccountTimeSeriesProcessor.getDrawdownSeries(accountId as string, start, end);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getAccountRanking(req: Request, res: Response): Promise<void> {
    try {
      const data = await TradingAccountDistributionProcessor.getAccountPerformanceRanking();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getProfitDistribution(req: Request, res: Response): Promise<void> {
    try {
      const data = await TradingAccountDistributionProcessor.getProfitDistribution();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getSharpeRatio(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const sharpe = await TradingAccountMetricsComputer.getSharpeRatio(accountId as string);
      res.json({ success: true, data: sharpe });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getProfitFactor(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const pf = await TradingAccountMetricsComputer.getProfitFactor(accountId as string);
      res.json({ success: true, data: pf });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getMaxDrawdown(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const maxdd = await TradingAccountMetricsComputer.getMaxDrawdown(accountId as string);
      res.json({ success: true, data: maxdd });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getWinRate(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const winRate = await TradingAccountMetricsComputer.getWinRate(accountId as string);
      res.json({ success: true, data: winRate });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}