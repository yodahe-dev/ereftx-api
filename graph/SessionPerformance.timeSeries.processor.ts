// graph/SessionPerformance.timeSeries.processor.ts
import db from '../models';
import { Op } from 'sequelize';

const { SessionPerformance, TradingSession } = db;

type SessionPerformanceWithSession = {
  date: Date;
  netProfit: number;
  sessionId: string;
  session?: { name: string };
};

export class SessionPerformanceTimeSeriesProcessor {
  /**
   * Get win rate trend over time for a specific session.
   */
  static async getWinRateTrend(sessionId: string, start: Date, end: Date): Promise<{ date: string; winRate: number; totalTrades: number }[]> {
    const records = await SessionPerformance.findAll({
      where: {
        sessionId,
        date: { [Op.between]: [start, end] },
      },
      order: [['date', 'ASC']],
      attributes: ['date', 'winRate', 'totalTrades'],
    });
    return records.map(r => ({
      date: r.date.toISOString().split('T')[0],
      winRate: r.winRate,
      totalTrades: r.totalTrades,
    }));
  }

  /**
   * Get profit factor trend over time for a session.
   */
  static async getProfitFactorTrend(sessionId: string, start: Date, end: Date): Promise<{ date: string; profitFactor: number }[]> {
    const records = await SessionPerformance.findAll({
      where: {
        sessionId,
        date: { [Op.between]: [start, end] },
      },
      order: [['date', 'ASC']],
      attributes: ['date', 'profitFactor'],
    });
    return records.map(r => ({
      date: r.date.toISOString().split('T')[0],
      profitFactor: r.profitFactor,
    }));
  }

  /**
   * Get net profit per day for all sessions (compare sessions on same axis).
   */
  static async getNetProfitComparison(start: Date, end: Date): Promise<{ date: string; sessionName: string; netProfit: number }[]> {
    const records = await SessionPerformance.findAll({
      where: { date: { [Op.between]: [start, end] } },
      include: [{ model: TradingSession, as: 'session', attributes: ['name'] }],
      attributes: ['date', 'netProfit', 'sessionId'],
      order: [['date', 'ASC']],
    }) as SessionPerformanceWithSession[];
    return records.map(r => ({
      date: r.date.toISOString().split('T')[0],
      sessionName: r.session?.name || 'Unknown',
      netProfit: r.netProfit,
    }));
  }
}