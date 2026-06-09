// graph/TradingSession.distribution.processor.ts
import db from '../models';
import { Op } from 'sequelize';

const { Trade, TradingSession } = db;

export class TradingSessionDistributionProcessor {
  /**
   * Get overall win rate per session across all time.
   */
  static async getWinRatePerSession(): Promise<{ sessionName: string; winRate: number; totalTrades: number }[]> {
    const trades = await Trade.findAll({
      where: { status: 'closed' },
      attributes: ['closeSessionId', 'pnl'],
    });

    const sessionStats = new Map<string, { total: number; wins: number }>();
    for (const t of trades) {
      if (!t.closeSessionId) continue;
      const entry = sessionStats.get(t.closeSessionId) || { total: 0, wins: 0 };
      entry.total++;
      if (t.pnl > 0) entry.wins++;
      sessionStats.set(t.closeSessionId, entry);
    }

    const result = [];
    for (const [sessionId, stats] of sessionStats) {
      const session = await TradingSession.findByPk(sessionId);
      result.push({
        sessionName: session?.name ?? 'Unknown Session',
        winRate: (stats.wins / stats.total) * 100,
        totalTrades: stats.total,
      });
    }
    return result.sort((a,b) => b.winRate - a.winRate);
  }

  /**
   * Get profit factor per session.
   */
  static async getProfitFactorPerSession(): Promise<{ sessionName: string; profitFactor: number }[]> {
    const trades = await Trade.findAll({
      where: { status: 'closed' },
      attributes: ['closeSessionId', 'pnl'],
    });

    const sessionStats = new Map<string, { grossProfit: number; grossLoss: number }>();
    for (const t of trades) {
      if (!t.closeSessionId) continue;
      const entry = sessionStats.get(t.closeSessionId) || { grossProfit: 0, grossLoss: 0 };
      if (t.pnl > 0) entry.grossProfit += t.pnl;
      else entry.grossLoss += Math.abs(t.pnl);
      sessionStats.set(t.closeSessionId, entry);
    }

    const result = [];
    for (const [sessionId, stats] of sessionStats) {
      const session = await TradingSession.findByPk(sessionId);
      const profitFactor = stats.grossLoss === 0 ? stats.grossProfit : stats.grossProfit / stats.grossLoss;
      result.push({
        sessionName: session?.name ?? 'Unknown Session',
        profitFactor,
      });
    }
    return result.sort((a,b) => b.profitFactor - a.profitFactor);
  }
}