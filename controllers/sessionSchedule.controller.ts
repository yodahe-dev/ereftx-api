// controllers/sessionSchedule.controller.ts
import { Request, Response } from 'express';
import db from '../models';
import { SessionScheduleSearchService } from '../search/SessionSchedule.search.service';
import { FilterCondition } from '../search/filter.builder';

const { SessionSchedule } = db;
const searchService = new SessionScheduleSearchService();

export class SessionScheduleController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const schedule = await SessionSchedule.create(req.body);
      res.status(201).json({ success: true, data: schedule });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async get(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schedule = await SessionSchedule.findByPk(id as string);
      if (!schedule) throw new Error('Schedule not found');
      res.json({ success: true, data: schedule });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schedule = await SessionSchedule.findByPk(id as string);
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
      const schedule = await SessionSchedule.findByPk(id as string);
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

  static async getCurrentForSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const schedule = await searchService.getCurrentSchedule(sessionId as string);
      res.json({ success: true, data: schedule });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}