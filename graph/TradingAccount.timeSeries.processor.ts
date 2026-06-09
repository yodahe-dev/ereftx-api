// graph/TradingAccount.timeSeries.processor.ts
import db from '../models';
import { Op } from 'sequelize';

const { Trade } = db;

export class TradingAccountTimeSeriesProcessor {
  static async getEquityCurve(
    accountId: string,
    start: Date,
    end: Date,
    interval: 'hour' | 'day' | 'week'
  ): Promise<{ timestamp: Date; equity: number }[]> {
    const trades = await Trade.findAll({
      where: {
        accountId,
        closeTimestamp: { [Op.between]: [start, end] },
        status: 'closed'
      },
      order: [['closeTimestamp', 'ASC']],
      attributes: ['closeTimestamp', 'pnl'],
    });

    let runningEquity = 0;
    const result: { timestamp: Date; equity: number }[] = [];

    if (interval === 'hour') {
      const hourMap = new Map<number, number>();
      for (const t of trades) {
        const ts = t.closeTimestamp!;
        const hourKey = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate(), ts.getHours(), 0, 0).getTime();
        runningEquity += t.pnl;
        hourMap.set(hourKey, runningEquity);
      }
      for (const [ts, eq] of hourMap) result.push({ timestamp: new Date(ts), equity: eq });
    } else if (interval === 'day') {
      const dayMap = new Map<string, number>();
      for (const t of trades) {
        const dayKey = t.closeTimestamp!.toISOString().split('T')[0];
        runningEquity += t.pnl;
        dayMap.set(dayKey, runningEquity);
      }
      for (const [date, eq] of dayMap) result.push({ timestamp: new Date(date), equity: eq });
    } else if (interval === 'week') {
      const weekMap = new Map<string, number>();
      for (const t of trades) {
        const d = t.closeTimestamp!;
        const weekStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        runningEquity += t.pnl;
        weekMap.set(weekKey, runningEquity);
      }
      for (const [date, eq] of weekMap) result.push({ timestamp: new Date(date), equity: eq });
    }
    return result;
  }

  static async getDrawdownSeries(
    accountId: string,
    start: Date,
    end: Date
  ): Promise<{ timestamp: Date; drawdown: number }[]> {
    const equity = await this.getEquityCurve(accountId, start, end, 'day');
    let peak = 0;
    return equity.map(e => {
      peak = Math.max(peak, e.equity);
      const drawdown = peak ? ((peak - e.equity) / peak) * 100 : 0;
      return { timestamp: e.timestamp, drawdown };
    });
  }
}