// services/session.service.ts
import db from '../models';
import { WorldTimeService } from './worldtime.service';

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
}

export class SessionService {
  private worldTime = new WorldTimeService();
  private currentStateCache: Map<string, ActiveSessionInfo> = new Map();
  private lastRefresh = 0;

  async refreshCurrentSession(): Promise<ActiveSessionInfo> {
    const sessions = await TradingSession.findAll({ order: [['priority', 'ASC']] });
    const now = new Date();
    const nowUTC = now.getTime();

    const sessionStates = await Promise.all(
      sessions.map(async (session: any) => {
        const localNow = await this.worldTime.getCurrentTimeForTimezone(session.timezone);
        const openTime = this.computeSessionOpenTime(session, localNow);
        const closeTime = this.computeSessionCloseTime(session, localNow);
        const isOpen = localNow >= openTime && localNow < closeTime;
        return { session, localNow, openTime, closeTime, isOpen };
      })
    );

    const active = sessionStates.find(s => s.isOpen);
    let activeInfo: ActiveSessionInfo | null = null;

    if (active) {
      const secondsRemaining = Math.max(0, Math.floor((active.closeTime.getTime() - nowUTC) / 1000));
      const nextSession = this.findNextSession(sessionStates, nowUTC);
      activeInfo = {
        sessionId: active.session.id,
        name: active.session.name,
        abbreviation: active.session.abbreviation,
        isOpen: true,
        openTime: active.openTime,
        closeTime: active.closeTime,
        secondsRemaining,
        nextSession: nextSession ? {
          sessionId: nextSession.session.id,
          name: nextSession.session.name,
          openTime: nextSession.openTime,
          secondsUntil: Math.max(0, Math.floor((nextSession.openTime.getTime() - nowUTC) / 1000)),
        } : null,
      };
    } else {
      const next = this.findNextSession(sessionStates, nowUTC);
      if (next) {
        activeInfo = {
          sessionId: next.session.id,
          name: next.session.name,
          abbreviation: next.session.abbreviation,
          isOpen: false,
          openTime: next.openTime,
          closeTime: next.closeTime,
          secondsRemaining: 0,
          nextSession: null,
        };
      } else {
        throw new Error('No future session found');
      }
    }

    this.currentStateCache.set('current', activeInfo);
    this.lastRefresh = Date.now();
    return activeInfo;
  }

  private findNextSession(sessionStates: any[], nowUTC: number) {
    let best = null;
    for (const s of sessionStates) {
      if (s.openTime.getTime() > nowUTC) {
        if (!best || s.openTime.getTime() < best.openTime.getTime()) {
          best = s;
        }
      }
    }
    if (!best && sessionStates.length) {
      return sessionStates[0];
    }
    return best;
  }

  private computeSessionOpenTime(session: any, localNow: Date): Date {
    const openLocal = new Date(localNow);
    openLocal.setHours(session.localOpenHour, session.localOpenMinute, 0, 0);
    if (openLocal < localNow) {
      openLocal.setDate(openLocal.getDate() + 1);
    }
    return openLocal;
  }

  private computeSessionCloseTime(session: any, localNow: Date): Date {
    const closeLocal = new Date(localNow);
    closeLocal.setHours(session.localCloseHour, session.localCloseMinute, 0, 0);
    if (closeLocal <= localNow) {
      closeLocal.setDate(closeLocal.getDate() + 1);
    }
    return closeLocal;
  }

  getCachedSession(): ActiveSessionInfo | null {
    return this.currentStateCache.get('current') || null;
  }
}