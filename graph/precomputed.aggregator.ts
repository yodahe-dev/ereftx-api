// graph/precomputed.aggregator.ts
import db from '../models';
import { Op } from 'sequelize';

export class PrecomputedAggregator {
  static async refreshSessionPerformance(date: Date): Promise<void> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const trades = await db.Trade.findAll({
      where: {
        closeTimestamp: { [Op.between]: [start, end] },
        status: 'closed'
      },
      attributes: ['closeSessionId', 'pnl', 'riskPercent'],
    });

    const sessionMap = new Map<string, {
      total: number;
      wins: number;
      grossProfit: number;
      grossLoss: number;
      netProfit: number;
      riskSum: number;
    }>();

    for (const t of trades) {
      const sessId = t.closeSessionId;
      if (!sessId) continue;
      const entry = sessionMap.get(sessId) || {
        total: 0,
        wins: 0,
        grossProfit: 0,
        grossLoss: 0,
        netProfit: 0,
        riskSum: 0,
      };
      entry.total++;
      if (t.pnl > 0) {
        entry.wins++;
        entry.grossProfit += t.pnl;
      } else {
        entry.grossLoss += Math.abs(t.pnl);
      }
      entry.netProfit += t.pnl;
      entry.riskSum += t.riskPercent;
      sessionMap.set(sessId, entry);
    }

    for (const [sessId, stats] of sessionMap) {
      const winRate = stats.total ? (stats.wins / stats.total) * 100 : 0;
      const profitFactor = stats.grossLoss ? stats.grossProfit / stats.grossLoss : stats.grossProfit;
      await db.SessionPerformance.upsert({
        sessionId: sessId,
        date: start,
        totalTrades: stats.total,
        winningTrades: stats.wins,
        losingTrades: stats.total - stats.wins,
        grossProfit: stats.grossProfit,
        grossLoss: stats.grossLoss,
        netProfit: stats.netProfit,
        winRate,
        avgRR: stats.total ? stats.netProfit / stats.total : 0,
        profitFactor,
      });
    }
  }

  static async refreshHourlyStats(accountId: string, date: Date): Promise<void> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const trades = await db.Trade.findAll({
      where: {
        accountId,
        closeTimestamp: { [Op.between]: [start, end] },
        status: 'closed'
      },
      attributes: ['pnl', 'closeTimestamp'],
    });

    const hourMap = new Map<number, number[]>();
    for (const t of trades) {
      const hour = t.closeTimestamp!.getHours();
      const pnls = hourMap.get(hour) || [];
      pnls.push(t.pnl);
      hourMap.set(hour, pnls);
    }

    for (let hour = 0; hour < 24; hour++) {
      const pnls = hourMap.get(hour) || [];
      if (pnls.length === 0) continue;
      const total = pnls.length;
      const wins = pnls.filter(p => p > 0).length;
      const winRate = (wins / total) * 100;
      const grossProfit = pnls.filter(p => p > 0).reduce((a,b) => a+b, 0);
      const grossLoss = Math.abs(pnls.filter(p => p < 0).reduce((a,b) => a+b, 0));
      const profitFactor = grossLoss ? grossProfit / grossLoss : grossProfit;
      await db.SessionStatistic.upsert({
        accountId,
        metricDate: new Date(start.getFullYear(), start.getMonth(), start.getDate(), hour, 0, 0),
        granularity: 'hour',
        hourOfDay: hour,
        totalTrades: total,
        winRate,
        profitFactor,
      } as any);
    }
  }
}