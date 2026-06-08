// jobs/session.tracker.ts
import cron from 'node-cron';
import { SessionService } from '../service/session.service';

let sessionService: SessionService | null = null;

export function initSessionTracker(service: SessionService) {
  sessionService = service;
}

export function startSessionTracker() {
  if (!sessionService) throw new Error('SessionService not initialized');
  cron.schedule('* * * * *', async () => {
    try {
      await sessionService!.refreshCurrentSession();
      console.log('[SessionTracker] Updated current session');
    } catch (err) {
      console.error('[SessionTracker] Error:', err);
    }
  });
}