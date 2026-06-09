// jobs/TradingSession.updater.ts
import cron from 'node-cron';
import db from '../models';
import { WorldTimeService } from '../service/worldtime.service';

const { TradingSession, SessionSchedule } = db;
const worldTime = new WorldTimeService();

// Cache for session UTC boundaries to avoid repeated API calls
const boundaryCache = new Map<string, { openUTC: Date; closeUTC: Date }>();

export class TradingSessionUpdater {
  /**
   * Get the current UTC open and close times for a session based on its IANA timezone.
   * This uses the World Time API to get the exact offset including DST.
   */
  static async getCurrentSessionBoundaries(session: any): Promise<{ openUTC: Date; closeUTC: Date }> {
    const cacheKey = `${session.id}:${new Date().toISOString().split('T')[0]}`;
    if (boundaryCache.has(cacheKey)) {
      return boundaryCache.get(cacheKey)!;
    }

    // Get the current UTC offset for the session's timezone
    const timeData = await worldTime.getTimeForTimezone(session.timezone);
    const offsetStr = timeData.utc_offset; // e.g., "+01:00"
    const sign = offsetStr[0] === '+' ? 1 : -1;
    const parts = offsetStr.slice(1).split(':');
    const offsetHours = sign * parseInt(parts[0]);
    const offsetMinutes = sign * parseInt(parts[1]);
    const totalOffsetMinutes = offsetHours * 60 + offsetMinutes;

    // Build open and close times in local time for today
    const now = new Date();
    const openLocal = new Date(now);
    openLocal.setHours(session.localOpenHour, session.localOpenMinute, 0, 0);
    const closeLocal = new Date(now);
    closeLocal.setHours(session.localCloseHour, session.localCloseMinute, 0, 0);

    // Convert to UTC by subtracting offset
    const openUTC = new Date(openLocal.getTime() - totalOffsetMinutes * 60 * 1000);
    const closeUTC = new Date(closeLocal.getTime() - totalOffsetMinutes * 60 * 1000);

    // If close is before open (session crosses midnight), close belongs to next day
    if (closeUTC <= openUTC) {
      closeUTC.setDate(closeUTC.getDate() + 1);
    }

    boundaryCache.set(cacheKey, { openUTC, closeUTC });
    return { openUTC, closeUTC };
  }

  /**
   * Update the SessionSchedule table with the current DST‑aware boundaries.
   * This creates/updates a record for today.
   */
  static async updateTodaySchedule(): Promise<void> {
    const sessions = await TradingSession.findAll();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const session of sessions) {
      const { openUTC, closeUTC } = await this.getCurrentSessionBoundaries(session);
      await SessionSchedule.upsert({
        sessionId: session.id,
        effectiveFrom: today,
        effectiveTo: null, // mark as current (active)
        openHourUTC: openUTC.getUTCHours(),
        openMinuteUTC: openUTC.getUTCMinutes(),
        closeHourUTC: closeUTC.getUTCHours(),
        closeMinuteUTC: closeUTC.getUTCMinutes(),
      });
    }
  }

  /**
   * Start the scheduled job (runs daily at 00:30 UTC to capture any DST changes).
   */
  static start(): void {
    // Run daily at 30 minutes past midnight UTC
    cron.schedule('30 0 * * *', async () => {
      console.log('[TradingSessionUpdater] Updating session boundaries...');
      try {
        await this.updateTodaySchedule();
        console.log('[TradingSessionUpdater] Completed');
      } catch (err) {
        console.error('[TradingSessionUpdater] Error:', err);
      }
    });
  }
}