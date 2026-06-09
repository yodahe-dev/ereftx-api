import db from '../models';
import { Op } from 'sequelize';

const { TradingSession } = db;

export class TradeSessionAnalyzer {

  static async getSessionPerformance(accountId: string, start: Date, end: Date): Promise<any[]> {
    const trades = await db.Trade.findAll({
      where: {
        accountId,
        closeTimestamp: { [Op.between]: [start, end] },
        status: 'closed'
      },
      include: [{ model: TradingSession, as: 'closeSession' }],
      attributes: ['closeSessionId', 'pnl', 'riskPercent'],
    });

    const sessionStats = new Map<string, { total: number; wins: number; pnl: number }>();
    for (const t of trades) {
      const sessId = t.closeSessionId;
      if (!sessId) continue;
      const entry = sessionStats.get(sessId) || { total: 0, wins: 0, pnl: 0 };
      entry.total++;
      if (t.pnl > 0) entry.wins++;
      entry.pnl += t.pnl;
      sessionStats.set(sessId, entry);
    }

    const result = [];
    for (const [sessId, stats] of sessionStats) {
      const session = await TradingSession.findByPk(sessId);
      result.push({
        sessionName: session?.name,
        totalTrades: stats.total,
        winRate: (stats.wins / stats.total) * 100,
        netProfit: stats.pnl,
        avgProfit: stats.pnl / stats.total,
      });
    }
    return result.sort((a,b) => b.netProfit - a.netProfit);
  }

  static async getBestSession(accountId: string): Promise<any> {
    const performances = await db.SessionPerformance.findAll({
      include: [{ model: TradingSession, as: 'session' }],
      order: [['profitFactor', 'DESC']],
      limit: 1,
    });
    return performances[0];
  }
}