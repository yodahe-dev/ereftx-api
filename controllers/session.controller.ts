// controllers/session.controller.ts
import { Request, Response } from 'express';
import db from '../models';
import { SessionService } from '../service/session.service';

const { TradingSession } = db;

let sessionService: SessionService;

export function setSessionService(service: SessionService) {
  sessionService = service;
}

export class SessionController {
  static async getCurrentSession(req: Request, res: Response): Promise<void> {
    try {
      const data = sessionService.getCachedSession();
      if (!data) {
        const fresh = await sessionService.refreshCurrentSession();
        res.json({ success: true, data: fresh });
      } else {
        res.json({ success: true, data });
      }
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
      const sessions = await TradingSession.findAll();
      const schedule = [];
      for (const sess of sessions) {
        const localNow = await sessionService['worldTime'].getCurrentTimeForTimezone(sess.timezone);
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