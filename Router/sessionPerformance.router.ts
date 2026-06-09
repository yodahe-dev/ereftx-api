import { Router } from 'express';
import { SessionPerformanceController } from '../controllers/sessionPerformance.controller';

const router = Router();

// CRUD (read-only)
router.get('/', SessionPerformanceController.list);
router.get('/:id', SessionPerformanceController.get);
router.get('/session/:sessionId/date/:date', SessionPerformanceController.getBySessionAndDate);

// Analytics
router.get('/analytics/winrate-trend/:sessionId', SessionPerformanceController.getWinRateTrend);
router.get('/analytics/profitfactor-trend/:sessionId', SessionPerformanceController.getProfitFactorTrend);
router.get('/analytics/netprofit-comparison', SessionPerformanceController.getNetProfitComparison);
router.get('/analytics/avg-winrate', SessionPerformanceController.getAverageWinRatePerSession);
router.get('/analytics/best-session', SessionPerformanceController.getBestSessionByProfitFactor);
router.get('/analytics/summary', SessionPerformanceController.getSessionSummary);
router.get('/analytics/underperforming', SessionPerformanceController.getUnderperformingSessions);

export default router;