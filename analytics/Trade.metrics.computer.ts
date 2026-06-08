// analytics/Trade.metrics.computer.ts
import db from '../models';

export class TradeMetricsComputer {
  static async getSharpeRatio(accountId: string, riskFreeRate: number = 0.02): Promise<number> {
    const trades = await db.Trade.findAll({
      where: { accountId, status: 'closed' },
      attributes: ['pnl'],
    });
    if (trades.length < 2) return 0;
    const returns = trades.map(t => t.pnl);
    const mean = returns.reduce((a,b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);
    if (stdDev === 0) return 0;
    return (mean - riskFreeRate) / stdDev;
  }

  static async getExpectancy(accountId: string): Promise<number> {
    const trades = await db.Trade.findAll({
      where: { accountId, status: 'closed' },
      attributes: ['pnl'],
    });
    if (trades.length === 0) return 0;
    return trades.reduce((a,b) => a + b.pnl, 0) / trades.length;
  }

  static async getProfitFactor(accountId: string): Promise<number> {
    const trades = await db.Trade.findAll({
      where: { accountId, status: 'closed' },
      attributes: ['pnl'],
    });
    const grossProfit = trades.filter(t => t.pnl > 0).reduce((a,b) => a + b.pnl, 0);
    const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((a,b) => a + b.pnl, 0));
    return grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
  }

  static async getMaxDrawdown(accountId: string): Promise<number> {
    const trades = await db.Trade.findAll({
      where: { accountId, status: 'closed' },
      order: [['closeTimestamp', 'ASC']],
      attributes: ['pnl'],
    });
    let peak = 0;
    let running = 0;
    let maxDD = 0;
    for (const t of trades) {
      running += t.pnl;
      if (running > peak) peak = running;
      const dd = peak ? ((peak - running) / peak) * 100 : 0;
      if (dd > maxDD) maxDD = dd;
    }
    return maxDD;
  }
}