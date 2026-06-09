// analytics/SessionPerformance.analyzer.ts
import db from '../models';
import { Op } from 'sequelize';

const { SessionPerformance, TradingSession } = db;

type SessionSummary = {
  sessionName: string;
  totalTrades: number;
  netProfit: number;
  avgWinRate: number;
  avgProfitFactor: number;
};

type SessionPerformanceRecord = {
  sessionId: string;
  totalTrades: number;
  netProfit: number;
  winRate: number;
  profitFactor: number;
};

export class SessionPerformanceAnalyzer {
  /**
   * Get session performance summary for a date range.
   */
  static async getSessionSummary(
    start: Date,
    end: Date
  ): Promise<SessionSummary[]> {
    const records = await SessionPerformance.findAll({
      where: {
        date: {
          [Op.between]: [start, end],
        },
      },
      include: [
        {
          model: TradingSession,
          as: 'session',
          attributes: ['name'],
        },
      ],
      attributes: [
        'sessionId',
        'totalTrades',
        'netProfit',
        'winRate',
        'profitFactor',
      ],
      raw: true,
    });

    const sessionMap = new Map<
      string,
      {
        totalTrades: number;
        netProfit: number;
        winRateSum: number;
        profitFactorSum: number;
        count: number;
      }
    >();

    for (const record of records as SessionPerformanceRecord[]) {
      const entry = sessionMap.get(record.sessionId) || {
        totalTrades: 0,
        netProfit: 0,
        winRateSum: 0,
        profitFactorSum: 0,
        count: 0,
      };

      entry.totalTrades += Number(record.totalTrades);
      entry.netProfit += Number(record.netProfit);
      entry.winRateSum += Number(record.winRate);
      entry.profitFactorSum += Number(record.profitFactor);
      entry.count++;

      sessionMap.set(record.sessionId, entry);
    }

    const result: SessionSummary[] = [];

    for (const [sessionId, stats] of sessionMap.entries()) {
      const session = await TradingSession.findByPk(sessionId);

      result.push({
        sessionName: session?.get('name') as string ?? 'Unknown',
        totalTrades: stats.totalTrades,
        netProfit: stats.netProfit,
        avgWinRate: stats.count > 0
          ? stats.winRateSum / stats.count
          : 0,
        avgProfitFactor: stats.count > 0
          ? stats.profitFactorSum / stats.count
          : 0,
      });
    }

    return result.sort(
      (a, b) => Number(b.netProfit) - Number(a.netProfit)
    );
  }

  /**
   * Detect underperforming sessions (profit factor < 1).
   */
  static async getUnderperformingSessions(): Promise<any[]> {
    const records = await SessionPerformance.findAll({
      where: {
        profitFactor: {
          [Op.lt]: 1,
        },
      },
      include: [
        {
          model: TradingSession,
          as: 'session',
        },
      ],
      order: [['profitFactor', 'ASC']],
    });

    return records;
  }
}