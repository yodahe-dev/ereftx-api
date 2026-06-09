// analytics/TradingSchedule.analyzer.ts
import db from '../models';
import { Op } from 'sequelize';

const { UserTradingSchedule, Trade, TradingSession } = db;

export class TradingScheduleAnalyzer {
  /**
   * Compare PnL for trades inside vs outside scheduled hours.
   */
  static async getScheduleEffectiveness(): Promise<{
    insideSchedule: { totalTrades: number; totalPnl: number; avgPnl: number };
    outsideSchedule: { totalTrades: number; totalPnl: number; avgPnl: number };
  }> {
    const schedules = await UserTradingSchedule.findAll({ where: { isActive: true } });
    const scheduleMap = new Map<number, { startMinutes: number; endMinutes: number }>();
    for (const s of schedules) {
      const startMinutes = s.startHourLocal * 60 + s.startMinuteLocal;
      const endMinutes = s.endHourLocal * 60 + s.endMinuteLocal;
      scheduleMap.set(s.dayOfWeek, { startMinutes, endMinutes });
    }

    const trades = await Trade.findAll({
      where: { status: 'closed' },
      attributes: ['closeTimestamp', 'pnl'],
    });

    let inside = { totalTrades: 0, totalPnl: 0 };
    let outside = { totalTrades: 0, totalPnl: 0 };

    for (const t of trades) {
      const ts = t.closeTimestamp!;
      const dayOfWeek = ts.getDay();
      const timeMinutes = ts.getHours() * 60 + ts.getMinutes();
      const schedule = scheduleMap.get(dayOfWeek);
      const isInside = schedule ? (timeMinutes >= schedule.startMinutes && timeMinutes < schedule.endMinutes) : false;

      if (isInside) {
        inside.totalTrades++;
        inside.totalPnl += t.pnl;
      } else {
        outside.totalTrades++;
        outside.totalPnl += t.pnl;
      }
    }

    return {
      insideSchedule: {
        totalTrades: inside.totalTrades,
        totalPnl: inside.totalPnl,
        avgPnl: inside.totalTrades ? inside.totalPnl / inside.totalTrades : 0,
      },
      outsideSchedule: {
        totalTrades: outside.totalTrades,
        totalPnl: outside.totalPnl,
        avgPnl: outside.totalTrades ? outside.totalPnl / outside.totalTrades : 0,
      },
    };
  }

  /**
   * Get best day of week based on average PnL when trading inside schedule.
   */
  static async getBestScheduleDay(): Promise<any> {
    const schedules = await UserTradingSchedule.findAll({ where: { isActive: true } });
    const scheduleMap = new Map<number, { start: number; end: number; sessionId: string | null }>();
    for (const s of schedules) {
      scheduleMap.set(s.dayOfWeek, {
        start: s.startHourLocal * 60 + s.startMinuteLocal,
        end: s.endHourLocal * 60 + s.endMinuteLocal,
        sessionId: s.sessionId,
      });
    }

    const trades = await Trade.findAll({
      where: { status: 'closed' },
      attributes: ['closeTimestamp', 'pnl'],
    });

    const dayStats = new Map<number, { totalPnl: number; count: number }>();
    for (const t of trades) {
      const ts = t.closeTimestamp!;
      const dayOfWeek = ts.getDay();
      const timeMinutes = ts.getHours() * 60 + ts.getMinutes();
      const schedule = scheduleMap.get(dayOfWeek);
      if (schedule && timeMinutes >= schedule.start && timeMinutes < schedule.end) {
        const entry = dayStats.get(dayOfWeek) || { totalPnl: 0, count: 0 };
        entry.totalPnl += t.pnl;
        entry.count++;
        dayStats.set(dayOfWeek, entry);
      }
    }

    let bestDay = null;
    let bestAvg = -Infinity;
    for (const [day, stats] of dayStats) {
      const avg = stats.totalPnl / stats.count;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestDay = day;
      }
    }
    return { bestDay, bestAvg, stats: dayStats.get(bestDay!) };
  }
}