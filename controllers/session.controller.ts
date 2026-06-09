// controllers/session.controller.ts
import { Request, Response } from 'express';
import { SessionService } from '../service/session.service';
import db from '../models';

let sessionService: SessionService;

export function setSessionService(service: SessionService) {
  sessionService = service;
}

export class SessionController {
  static async getCurrentSession(req: Request, res: Response): Promise<void> {
    try {
      // Always recompute if ?refresh=true, else try cache
      const refresh = req.query.refresh === 'true';
      let data;
      if (refresh) {
        data = await sessionService.refreshCurrentSession();
      } else {
        data = sessionService.getCachedSession();
        if (!data) data = await sessionService.refreshCurrentSession();
      }
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async refreshSession(req: Request, res: Response): Promise<void> {
    try {
      const data = await sessionService.refreshCurrentSession();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getSessionSchedule(req: Request, res: Response): Promise<void> {
    try {
      const sessions = await db.TradingSession.findAll();
      const schedule = [];
      for (const sess of sessions) {
        const timeData = await sessionService['worldTime'].getTimeForTimezone(sess.timezone);
        const localNow = new Date(timeData.datetime);
        const open = new Date(localNow);
        open.setHours(sess.localOpenHour, sess.localOpenMinute, 0, 0);
        const close = new Date(localNow);
        close.setHours(sess.localCloseHour, sess.localCloseMinute, 0, 0);
        schedule.push({
          name: sess.name,
          timezone: sess.timezone,
          openLocal: open.toISOString(),
          closeLocal: close.toISOString(),
        });
      }
      res.json({ success: true, data: schedule });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}