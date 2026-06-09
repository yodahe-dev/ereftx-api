// services/session.service.ts
import db from '../models';
import { WorldTimeService } from './worldtime.service';
import { Op } from 'sequelize';

const { TradingSession } = db;

export interface ActiveSessionInfo {
  sessionId: string;
  name: string;
  abbreviation: string;
  isOpen: boolean;
  openTime: Date;
  closeTime: Date;
  secondsRemaining: number;
  nextSession: {
    sessionId: string;
    name: string;
    openTime: Date;
    secondsUntil: number;
  } | null;
  isWeekend: boolean;
  isHoliday: boolean;
}

export class SessionService {
  private worldTime = new WorldTimeService();
  private cache: Map<string, { data: ActiveSessionInfo; expiresAt: number }> = new Map();
  private cacheTTL = 60_000; // 1 minute

  private async isHoliday(date: Date): Promise<boolean> {
    if (!db.Holiday) return false;
    const holiday = await db.Holiday.findOne({
      where: {
        date: {
          [Op.between]: [
            new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
          ]
        }
      }
    });
    return !!holiday;
  }

  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  async getCurrentSessionInfo(): Promise<ActiveSessionInfo> {
    const cacheKey = 'current_session';
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const sessions = await TradingSession.findAll({ order: [['priority', 'ASC']] });
    if (!sessions.length) {
      throw new Error('No trading sessions defined in database');
    }

    const now = new Date();
    const nowUTC = now.getTime();

    // Fetch UTC offsets and compute open/close times for each session (today)
    const sessionStates = await Promise.all(
      sessions.map(async (session: any) => {
        const timeData = await this.worldTime.getTimeForTimezone(session.timezone);
        const localNow = new Date(timeData.datetime);
        const offsetStr = timeData.utc_offset;
        const sign = offsetStr[0] === '+' ? 1 : -1;
        const parts = offsetStr.slice(1).split(':');
        const offsetHours = sign * parseInt(parts[0]);
        const offsetMinutes = sign * parseInt(parts[1]);
        const totalOffsetMinutes = offsetHours * 60 + offsetMinutes;

        // Today's open/close in local time
        const openLocal = new Date(localNow);
        openLocal.setHours(session.localOpenHour, session.localOpenMinute, 0, 0);
        const closeLocal = new Date(localNow);
        closeLocal.setHours(session.localCloseHour, session.localCloseMinute, 0, 0);

        // Convert to UTC
        let openUTC = new Date(openLocal.getTime() - totalOffsetMinutes * 60 * 1000);
        let closeUTC = new Date(closeLocal.getTime() - totalOffsetMinutes * 60 * 1000);
        if (closeUTC <= openUTC) {
          closeUTC.setDate(closeUTC.getDate() + 1);
        }

        const isOpen = localNow >= openLocal && localNow < closeLocal;
        return { session, openUTC, closeUTC, isOpen };
      })
    );

    // Determine weekend/holiday (using first session's local date)
    const anyLocal = sessionStates[0] ? new Date((await this.worldTime.getTimeForTimezone(sessionStates[0].session.timezone)).datetime) : now;
    const isWeekend = this.isWeekend(anyLocal);
    const isHoliday = await this.isHoliday(anyLocal);

    // Find currently active session
    const active = sessionStates.find(s => s.isOpen);
    let activeInfo: ActiveSessionInfo | null = null;

    if (active) {
      const secondsRemaining = Math.max(0, Math.floor((active.closeUTC.getTime() - nowUTC) / 1000));
      const next = this.getNextSessionOccurrence(sessionStates, nowUTC);
      activeInfo = {
        sessionId: active.session.id,
        name: active.session.name,
        abbreviation: active.session.abbreviation,
        isOpen: true,
        openTime: active.openUTC,
        closeTime: active.closeUTC,
        secondsRemaining,
        nextSession: next ? {
          sessionId: next.session.id,
          name: next.session.name,
          openTime: next.openUTC,
          secondsUntil: Math.max(0, Math.floor((next.openUTC.getTime() - nowUTC) / 1000)),
        } : null,
        isWeekend,
        isHoliday,
      };
    } else {
      // No session open → get next session (could be tomorrow)
      const next = this.getNextSessionOccurrence(sessionStates, nowUTC);
      if (!next) {
        throw new Error('No future session could be determined');
      }
      activeInfo = {
        sessionId: next.session.id,
        name: next.session.name,
        abbreviation: next.session.abbreviation,
        isOpen: false,
        openTime: next.openUTC,
        closeTime: next.closeUTC,
        secondsRemaining: 0,
        nextSession: null,
        isWeekend,
        isHoliday,
      };
    }

    this.cache.set(cacheKey, { data: activeInfo, expiresAt: Date.now() + this.cacheTTL });
    return activeInfo;
  }

  /**
   * Finds the next session occurrence (today or tomorrow) after the given timestamp.
   * Returns the session with its open time adjusted to the next day if necessary.
   */
  private getNextSessionOccurrence(sessionStates: any[], nowUTC: number): { session: any; openUTC: Date; closeUTC: Date } | null {
    // First, look for any session that opens later today
    let best = null;
    let bestOpenTime = Infinity;
    for (const s of sessionStates) {
      if (s.openUTC.getTime() > nowUTC) {
        if (s.openUTC.getTime() < bestOpenTime) {
          bestOpenTime = s.openUTC.getTime();
          best = s;
        }
      }
    }
    if (best) return best;

    // If none opens today, take the earliest priority session and shift it to tomorrow
    if (sessionStates.length === 0) return null;
    // Choose the session with smallest priority (e.g., Sydney first)
    const earliest = sessionStates.reduce((a, b) => (a.session.priority < b.session.priority ? a : b));
    const tomorrowOpen = new Date(earliest.openUTC);
    tomorrowOpen.setDate(tomorrowOpen.getDate() + 1);
    const tomorrowClose = new Date(earliest.closeUTC);
    tomorrowClose.setDate(tomorrowClose.getDate() + 1);
    return {
      session: earliest.session,
      openUTC: tomorrowOpen,
      closeUTC: tomorrowClose,
    };
  }

  // For backward compatibility (used by session.controller)
  getCachedSession(): ActiveSessionInfo | null {
    const cached = this.cache.get('current_session');
    return cached ? cached.data : null;
  }

  async refreshCurrentSession(): Promise<ActiveSessionInfo> {
    return this.getCurrentSessionInfo();
  }
}