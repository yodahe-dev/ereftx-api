// analytics/TradingSession.analyzer.ts
import db from '../models';
import { Op } from 'sequelize';

const { Trade, TradingSession, SessionPerformance } = db;

export class TradingSessionAnalyzer {
  /**
   * Get the best session by profit factor.
   */
  static async getBestSessionByProfitFactor(): Promise<any> {
    const performances = await SessionPerformance.findAll({
      include: [{ model: TradingSession, as: 'session' }],
      order: [['profitFactor', 'DESC']],
      limit: 1,
    });
    return performances[0];
  }

  /**
   * Get the worst session by win rate.
   */
  static async getWorstSessionByWinRate(): Promise<any> {
    const performances = await SessionPerformance.findAll({
      include: [{ model: TradingSession, as: 'session' }],
      order: [['winRate', 'ASC']],
      limit: 1,
    });
    return performances[0];
  }

  /**
   * Get session performance trend (week over week).
   */
  static async getSessionTrend(sessionId: string, weeks: number = 4): Promise<any[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const performances = await SessionPerformance.findAll({
      where: {
        sessionId,
        date: { [Op.between]: [startDate, endDate] },
      },
      order: [['date', 'ASC']],
    });
    return performances;
  }

  /**
   * Compare two sessions side by side.
   */
  static async compareSessions(sessionId1: string, sessionId2: string): Promise<any> {
    const trades1 = await Trade.findAll({
      where: { closeSessionId: sessionId1, status: 'closed' },
      attributes: ['pnl'],
    });
    const trades2 = await Trade.findAll({
      where: { closeSessionId: sessionId2, status: 'closed' },
      attributes: ['pnl'],
    });

    const computeStats = (trades: any[]) => {
      const total = trades.length;
      const wins = trades.filter(t => t.pnl > 0).length;
      const grossProfit = trades.filter(t => t.pnl > 0).reduce((s,t) => s + t.pnl, 0);
      const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((s,t) => s + t.pnl, 0));
      return {
        totalTrades: total,
        winRate: total ? (wins / total) * 100 : 0,
        profitFactor: grossLoss === 0 ? grossProfit : grossProfit / grossLoss,
        netProfit: grossProfit - grossLoss,
      };
    };

    const session1 = await TradingSession.findByPk(sessionId1);
    const session2 = await TradingSession.findByPk(sessionId2);

    return {
      session1: { name: session1?.name, ...computeStats(trades1) },
      session2: { name: session2?.name, ...computeStats(trades2) },
    };
  }
}