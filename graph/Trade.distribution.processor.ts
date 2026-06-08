// graph/Trade.distribution.processor.ts
import db from '../models';
import { Op } from 'sequelize';

export class TradeDistributionProcessor {
  static async getWinLossDistribution(accountId: string): Promise<{
    winRate: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
  }> {
    const trades = await db.Trade.findAll({
      where: { accountId, status: 'closed' },
      attributes: ['pnl'],
    });
    if (trades.length === 0) return { winRate: 0, profitFactor: 0, avgWin: 0, avgLoss: 0 };
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const avgWin = wins.length ? wins.reduce((a,b) => a + b.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length ? Math.abs(losses.reduce((a,b) => a + b.pnl, 0) / losses.length) : 0;
    const winRate = (wins.length / trades.length) * 100;
    const profitFactor = avgLoss !== 0 ? avgWin / avgLoss : avgWin;
    return { winRate, profitFactor, avgWin, avgLoss };
  }

  static async getRiskRewardDistribution(accountId: string): Promise<{ rrBins: number[]; counts: number[] }> {
    const trades = await db.Trade.findAll({
      where: { accountId, status: 'closed', riskPercent: { [Op.gt]: 0 } },
      attributes: ['pnl', 'riskPercent'],
    });
    const rrBins = [0, 0.5, 1, 1.5, 2, 3, 5, 10];
    const counts = new Array(rrBins.length).fill(0);
    for (const t of trades) {
      const rr = t.pnl / (t.riskPercent * 0.01);
      let idx = rrBins.findIndex(b => rr < b);
      if (idx === -1) idx = rrBins.length - 1;
      counts[idx]++;
    }
    return { rrBins, counts };
  }
}