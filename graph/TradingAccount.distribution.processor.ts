// graph/TradingAccount.distribution.processor.ts
import db from '../models';

const { Trade, TradingAccount } = db;

export class TradingAccountDistributionProcessor {
  static async getAccountPerformanceRanking(): Promise<any[]> {
    const accounts = await TradingAccount.findAll();
    const result = [];
    for (const acc of accounts) {
      const trades = await Trade.findAll({
        where: { accountId: acc.id, status: 'closed' },
        attributes: ['pnl'],
      });
      const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
      const winCount = trades.filter(t => t.pnl > 0).length;
      const winRate = trades.length ? (winCount / trades.length) * 100 : 0;
      result.push({
        accountId: acc.id,
        name: acc.name,
        totalPnL,
        winRate,
        tradeCount: trades.length,
      });
    }
    return result.sort((a,b) => b.totalPnL - a.totalPnL);
  }

  static async getProfitDistribution(): Promise<{ bins: number[]; counts: number[] }> {
    const accounts = await TradingAccount.findAll();
    const profits = [];
    for (const acc of accounts) {
      const trades = await Trade.findAll({
        where: { accountId: acc.id, status: 'closed' },
        attributes: ['pnl'],
      });
      const total = trades.reduce((sum, t) => sum + t.pnl, 0);
      profits.push(total);
    }
    const bins = [-10000, -5000, -1000, 0, 1000, 5000, 10000, 50000];
    const counts = new Array(bins.length).fill(0);
    for (const p of profits) {
      let idx = bins.findIndex(b => p < b);
      if (idx === -1) idx = bins.length - 1;
      counts[idx]++;
    }
    return { bins, counts };
  }
}