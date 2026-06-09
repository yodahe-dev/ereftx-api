// graph/TradingSchedule.timeSeries.processor.ts
import db from '../models';
import { Op } from 'sequelize';

const { UserTradingSchedule, Trade, TradingSession } = db;

export class TradingScheduleTimeSeriesProcessor {
  /**
   * Get trading activity adherence to personal schedule over time.
   * Returns daily percentage of trades executed within scheduled hours.
   */
  static async getScheduleAdherence(
    start: Date,
    end: Date
  ): Promise<{ date: string; adherence: number; totalTrades: number; withinSchedule: number }[]> {
    const schedules = await UserTradingSchedule.findAll({ where: { isActive: true } });
    // Convert schedules to a map per day of week: Map<dayOfWeek, { start: number, end: number }>
    const scheduleMap = new Map<number, { startMinutes: number; endMinutes: number }>();
    for (const s of schedules) {
      const startMinutes = s.startHourLocal * 60 + s.startMinuteLocal;
      const endMinutes = s.endHourLocal * 60 + s.endMinuteLocal;
      scheduleMap.set(s.dayOfWeek, { startMinutes, endMinutes });
    }

    const trades = await Trade.findAll({
      where: {
        closeTimestamp: { [Op.between]: [start, end] },
        status: 'closed',
      },
      attributes: ['closeTimestamp'],
    });

    const dailyStats = new Map<string, { total: number; within: number }>();
    for (const t of trades) {
      const ts = t.closeTimestamp!;
      const dateKey = ts.toISOString().split('T')[0];
      const dayOfWeek = ts.getDay(); // 0=Sunday..6=Saturday
      const timeMinutes = ts.getHours() * 60 + ts.getMinutes();
      const schedule = scheduleMap.get(dayOfWeek);
      const within = schedule ? (timeMinutes >= schedule.startMinutes && timeMinutes < schedule.endMinutes) : false;

      const entry = dailyStats.get(dateKey) || { total: 0, within: 0 };
      entry.total++;
      if (within) entry.within++;
      dailyStats.set(dateKey, entry);
    }

    const result = [];
    for (const [date, stats] of dailyStats) {
      result.push({
        date,
        adherence: (stats.within / stats.total) * 100,
        totalTrades: stats.total,
        withinSchedule: stats.within,
      });
    }
    return result.sort((a,b) => a.date.localeCompare(b.date));
  }
}