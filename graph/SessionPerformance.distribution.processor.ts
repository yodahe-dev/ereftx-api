import db from '../models';
import { Op } from 'sequelize';

const { SessionPerformance, TradingSession } = db;

type SessionWinRateSummary = {
  sessionName: string;
  avgWinRate: number;
};

export class SessionPerformanceDistributionProcessor {
  /**
   * Get overall average win rate per session across all time.
   */
  static async getAverageWinRatePerSession(): Promise<SessionWinRateSummary[]> {
    const results = await SessionPerformance.findAll({
      include: [
        {
          model: TradingSession,
          as: 'session',
          attributes: ['name'],
        },
      ],
      attributes: ['sessionId', 'winRate'],
    });

    const sessionMap = new Map<
      string,
      {
        sum: number;
        count: number;
      }
    >();

    for (const record of results as any[]) {
      const entry = sessionMap.get(record.sessionId) || {
        sum: 0,
        count: 0,
      };

      entry.sum += Number(record.winRate);
      entry.count++;

      sessionMap.set(record.sessionId, entry);
    }

    const output: SessionWinRateSummary[] = [];

    for (const [sessionId, stats] of sessionMap.entries()) {
      const session = await TradingSession.findByPk(sessionId);

      output.push({
        sessionName: (session?.get('name') as string) ?? 'Unknown',
        avgWinRate: stats.count > 0
          ? stats.sum / stats.count
          : 0,
      });
    }

    return output.sort(
      (a, b) => b.avgWinRate - a.avgWinRate
    );
  }

  /**
   * Get best performing session by average profit factor.
   */
  static async getBestSessionByProfitFactor(): Promise<any> {
    const result = await SessionPerformance.findOne({
      include: [
        {
          model: TradingSession,
          as: 'session',
        },
      ],
      order: [['profitFactor', 'DESC']],
    });

    return result;
  }
}