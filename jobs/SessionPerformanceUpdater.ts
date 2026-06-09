// jobs/SessionPerformanceUpdater.ts
import cron from 'node-cron';
import db from '../models';
import { WorldTimeService } from '../service/worldtime.service';
import { Op } from 'sequelize';

const { TradingSession, Trade, SessionPerformance } = db;
const worldTime = new WorldTimeService();

// Cache for session UTC boundaries per date (avoid repeated API calls)
const sessionBoundaryCache = new Map<string, { openUTC: Date; closeUTC: Date }>();

export class SessionPerformanceUpdater {
  /**
   * Get UTC open and close times for a given session on a specific date.
   * Uses World Time API to get the current offset (including DST) for that session's timezone.
   * Caches results per session+date.
   */
  private static async getSessionUTCBoundaries(
    session: any,
    date: Date
  ): Promise<{ openUTC: Date; closeUTC: Date }> {
    const cacheKey = `${session.id}:${date.toISOString().split('T')[0]}`;
    if (sessionBoundaryCache.has(cacheKey)) {
      return sessionBoundaryCache.get(cacheKey)!;
    }

    // Get the timezone's current UTC offset at noon on the target date
    const noonLocal = new Date(date);
    noonLocal.setHours(12, 0, 0, 0);
    const timeData = await worldTime.getTimeForTimezone(session.timezone);
    const offsetMs = timeData.utc_offset; // e.g., "+01:00"
    const offsetHours = parseInt(offsetMs.slice(1, 3)) * (offsetMs[0] === '+' ? 1 : -1);
    const offsetMinutes = parseInt(offsetMs.slice(4, 6)) * (offsetMs[0] === '+' ? 1 : -1);
    const totalOffsetMinutes = offsetHours * 60 + offsetMinutes;

    // Build open time in local time on the target date
    const openLocal = new Date(date);
    openLocal.setHours(session.localOpenHour, session.localOpenMinute, 0, 0);
    const closeLocal = new Date(date);
    closeLocal.setHours(session.localCloseHour, session.localCloseMinute, 0, 0);

    // Convert to UTC by subtracting offset
    const openUTC = new Date(openLocal.getTime() - totalOffsetMinutes * 60 * 1000);
    const closeUTC = new Date(closeLocal.getTime() - totalOffsetMinutes * 60 * 1000);

    // If close is before open (e.g., session crosses midnight), close belongs to next day
    if (closeUTC <= openUTC) {
      closeUTC.setDate(closeUTC.getDate() + 1);
    }

    const result = { openUTC, closeUTC };
    sessionBoundaryCache.set(cacheKey, result);
    return result;
  }

  /**
   * Refresh session performance for a specific date.
   */
  static async refreshForDate(date: Date): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const sessions = await TradingSession.findAll();
    const allTrades = await Trade.findAll({
      where: {
        closeTimestamp: { [Op.between]: [startOfDay, endOfDay] },
        status: 'closed',
      },
      attributes: ['closeSessionId', 'pnl', 'riskPercent', 'closeTimestamp'],
    });

    // Group trades by sessionId
    const tradesBySession = new Map<string, any[]>();
    for (const trade of allTrades) {
      if (!trade.closeSessionId) continue;
      const arr = tradesBySession.get(trade.closeSessionId) || [];
      arr.push(trade);
      tradesBySession.set(trade.closeSessionId, arr);
    }

    // For each session, calculate performance
    for (const session of sessions) {
      const trades = tradesBySession.get(session.id) || [];
      if (trades.length === 0) continue;

      const totalTrades = trades.length;
      const winningTrades = trades.filter(t => t.pnl > 0).length;
      const losingTrades = totalTrades - winningTrades;
      const grossProfit = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
      const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
      const netProfit = grossProfit - grossLoss;
      const winRate = (winningTrades / totalTrades) * 100;
      const avgRR = totalTrades ? netProfit / totalTrades : 0;
      const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;

      await SessionPerformance.upsert({
        sessionId: session.id,
        date: startOfDay,
        totalTrades,
        winningTrades,
        losingTrades,
        grossProfit,
        grossLoss,
        netProfit,
        winRate,
        avgRR,
        profitFactor,
      });
    }
  }

  /**
   * Refresh session performance for a range of dates (backfill).
   */
  static async backfill(startDate: Date, endDate: Date): Promise<void> {
    const current = new Date(startDate);
    while (current <= endDate) {
      await this.refreshForDate(current);
      current.setDate(current.getDate() + 1);
    }
  }

  /**
   * Start the scheduled job (daily at 00:05 UTC).
   */
  static start(): void {
    // Run daily at 5 minutes past midnight UTC
    cron.schedule('5 0 * * *', async () => {
      console.log('[SessionPerformanceUpdater] Running scheduled refresh...');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      try {
        await this.refreshForDate(yesterday);
        console.log('[SessionPerformanceUpdater] Completed');
      } catch (err) {
        console.error('[SessionPerformanceUpdater] Error:', err);
      }
    });
  }
}