// graph/TradingSession.timeSeries.processor.ts
import db from '../models';
import { Op } from 'sequelize';

const { Trade, TradingSession } = db;

export class TradingSessionTimeSeriesProcessor {
  /**
   * Get number of trades executed per session over a date range.
   */
  static async getTradeVolumePerSession(
    start: Date,
    end: Date
  ): Promise<{ sessionName: string; date: string; tradeCount: number }[]> {
    const trades = await Trade.findAll({
      where: {
        closeTimestamp: { [Op.between]: [start, end] },
        status: 'closed',
      },
      attributes: ['closeSessionId', 'closeTimestamp'],
    });

    const sessionMap = new Map<string, Map<string, number>>();
    for (const t of trades) {
      if (!t.closeSessionId) continue;
      const dateKey = t.closeTimestamp!.toISOString().split('T')[0];
      let dateMap = sessionMap.get(t.closeSessionId);
      if (!dateMap) {
        dateMap = new Map();
        sessionMap.set(t.closeSessionId, dateMap);
      }
      const count = dateMap.get(dateKey) || 0;
      dateMap.set(dateKey, count + 1);
    }

    const result = [];
    for (const [sessionId, dateMap] of sessionMap) {
      const session = await TradingSession.findByPk(sessionId);
      for (const [date, tradeCount] of dateMap) {
        result.push({
          sessionName: session?.name ?? sessionId,
          date,
          tradeCount,
        });
      }
    }
    return result.sort((a,b) => a.date.localeCompare(b.date));
  }

  /**
   * Get average PnL per session over time.
   */
  static async getPnLPerSession(
    start: Date,
    end: Date
  ): Promise<{ sessionName: string; date: string; avgPnl: number }[]> {
    const trades = await Trade.findAll({
      where: {
        closeTimestamp: { [Op.between]: [start, end] },
        status: 'closed',
      },
      attributes: ['closeSessionId', 'closeTimestamp', 'pnl'],
    });

    const sessionMap = new Map<string, Map<string, { sum: number; count: number }>>();
    for (const t of trades) {
      if (!t.closeSessionId) continue;
      const dateKey = t.closeTimestamp!.toISOString().split('T')[0];
      let dateMap = sessionMap.get(t.closeSessionId);
      if (!dateMap) {
        dateMap = new Map();
        sessionMap.set(t.closeSessionId, dateMap);
      }
      const entry = dateMap.get(dateKey) || { sum: 0, count: 0 };
      entry.sum += t.pnl;
      entry.count++;
      dateMap.set(dateKey, entry);
    }

    const result = [];
    for (const [sessionId, dateMap] of sessionMap) {
      const session = await TradingSession.findByPk(sessionId);
      for (const [date, stats] of dateMap) {
        result.push({
          sessionName: session?.name ?? sessionId,
          date,
          avgPnl: stats.sum / stats.count,
        });
      }
    }
    return result.sort((a,b) => a.date.localeCompare(b.date));
  }
}