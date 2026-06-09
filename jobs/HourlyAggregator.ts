// jobs/HourlyAggregator.ts
import cron from 'node-cron';
import db from '../models';
import { WorldTimeService } from '../service/worldtime.service';
import { Op } from 'sequelize';

const { TradingAccount, Trade, SessionStatistic } = db;
const worldTime = new WorldTimeService();

// Cache for hourly UTC boundaries per date (avoid repeated API calls)
const hourBoundaryCache = new Map<string, { startUTC: Date; endUTC: Date }>();

export class HourlyAggregator {
  /**
   * Get UTC start and end times for a given hour (local time) on a specific date.
   * Uses World Time API to get the UTC offset for the account's timezone (or a default).
   */
  private static async getHourUTCBoundaries(
    date: Date,
    hour: number,
    timezone: string = 'UTC'
  ): Promise<{ startUTC: Date; endUTC: Date }> {
    const cacheKey = `${timezone}:${date.toISOString().split('T')[0]}:${hour}`;
    if (hourBoundaryCache.has(cacheKey)) {
      return hourBoundaryCache.get(cacheKey)!;
    }

    // Get offset for the given timezone at the start of the hour
    const localStart = new Date(date);
    localStart.setHours(hour, 0, 0, 0);
    let offsetHours = 0;
    let offsetMinutes = 0;

    if (timezone !== 'UTC') {
      const timeData = await worldTime.getTimeForTimezone(timezone);
      const offsetStr = timeData.utc_offset; // e.g., "+01:00" or "-05:00"
      const sign = offsetStr[0] === '+' ? 1 : -1;
      const parts = offsetStr.slice(1).split(':');
      offsetHours = sign * parseInt(parts[0]);
      offsetMinutes = sign * parseInt(parts[1]);
    }

    const totalOffsetMinutes = offsetHours * 60 + offsetMinutes;
    const startUTC = new Date(localStart.getTime() - totalOffsetMinutes * 60 * 1000);
    const endUTC = new Date(startUTC.getTime() + 60 * 60 * 1000);

    const result = { startUTC, endUTC };
    hourBoundaryCache.set(cacheKey, result);
    return result;
  }

  /**
   * Refresh hourly statistics for a specific account on a specific date.
   * This will compute win rate, profit factor, trade count, etc. for each hour (0-23).
   */
  static async refreshForAccountAndDate(accountId: string, date: Date): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Fetch all closed trades for this account on this date
    const trades = await Trade.findAll({
      where: {
        accountId,
        closeTimestamp: { [Op.between]: [startOfDay, endOfDay] },
        status: 'closed',
      },
      attributes: ['closeTimestamp', 'pnl', 'riskPercent'],
    });

    if (trades.length === 0) return;

    // Group trades by hour (using local hour of the trade's timestamp)
    // For simplicity, we use UTC hour. If you need local hour based on account timezone,
    // you would need to store account timezone. Here we assume UTC for consistency.
    const hourStats = new Map<number, { total: number; wins: number; grossProfit: number; grossLoss: number }>();
    for (const trade of trades) {
      const hour = trade.closeTimestamp!.getUTCHours();
      const entry = hourStats.get(hour) || { total: 0, wins: 0, grossProfit: 0, grossLoss: 0 };
      entry.total++;
      if (trade.pnl > 0) {
        entry.wins++;
        entry.grossProfit += trade.pnl;
      } else {
        entry.grossLoss += Math.abs(trade.pnl);
      }
      hourStats.set(hour, entry);
    }

    // For each hour that had trades, compute metrics and upsert
    for (const [hour, stats] of hourStats) {
      const winRate = (stats.wins / stats.total) * 100;
      const profitFactor = stats.grossLoss === 0 ? stats.grossProfit : stats.grossProfit / stats.grossLoss;
      const avgProfit = stats.total ? (stats.grossProfit - stats.grossLoss) / stats.total : 0;

      await SessionStatistic.upsert({
        accountId,
        metricDate: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0),
        granularity: 'hour',
        hourOfDay: hour,
        totalTrades: stats.total,
        winRate,
        profitFactor,
      });
    }
  }

  /**
   * Refresh hourly statistics for all accounts on a specific date.
   */
  static async refreshForDate(date: Date): Promise<void> {
    const accounts = await TradingAccount.findAll({ attributes: ['id'] });
    for (const account of accounts) {
      await this.refreshForAccountAndDate(account.id, date);
    }
  }

  /**
   * Backfill hourly statistics for a date range.
   */
  static async backfill(startDate: Date, endDate: Date): Promise<void> {
    const current = new Date(startDate);
    while (current <= endDate) {
      console.log(`[HourlyAggregator] Backfilling ${current.toISOString().split('T')[0]}...`);
      await this.refreshForDate(current);
      current.setDate(current.getDate() + 1);
    }
  }

  /**
   * Start the scheduled job (runs every hour at minute 5).
   */
  static start(): void {
    // Run at 5 minutes past every hour (UTC)
    cron.schedule('5 * * * *', async () => {
      console.log('[HourlyAggregator] Running scheduled refresh...');
      const today = new Date();
      try {
        await this.refreshForDate(today);
        console.log('[HourlyAggregator] Completed');
      } catch (err) {
        console.error('[HourlyAggregator] Error:', err);
      }
    });
  }
}