// controllers/trade.controller.ts
import { Request, Response } from 'express';
import { TradeService } from '../service/trade.service';
import { TradeSearchService } from '../search/Trade.search.service';
import { FilterCondition } from '../search/filter.builder';

const searchService = new TradeSearchService();
searchService.init(); // preload trie

export class TradeController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const trade = await TradeService.create(req.body);
      res.status(201).json({ success: true, data: trade });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async get(req: Request, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const trade = await TradeService.getById(id);
      res.json({ success: true, data: trade });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const trade = await TradeService.update(id, req.body);
      res.json({ success: true, data: trade });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await TradeService.delete(id);
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
      const result = await TradeService.list(filters, page, limit);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async search(req: Request, res: Response): Promise<void> {
    try {
      const filters: FilterCondition[] = req.body.filters || [];
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await searchService.searchTrades(filters, page, limit);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async advancedSearch(req: Request, res: Response): Promise<void> {
    try {
      const groups: FilterCondition[][] = req.body.groups || [];
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await searchService.advancedSearch(groups, page, limit);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async autoCompleteSymbol(req: Request, res: Response): Promise<void> {
    try {
      const prefix = Array.isArray(req.query.prefix) ? req.query.prefix[0] : (req.query.prefix as string);
      const symbols = await searchService.symbolAutoComplete(prefix as any);
      res.json({ success: true, data: symbols });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}