// routers/tradingSession.router.ts
import { Router } from 'express';
import { TradingSessionController } from '../controllers/tradingSession.controller';

const router = Router();

// CRUD
router.post('/', TradingSessionController.create);
router.get('/', TradingSessionController.list);
router.get('/:id', TradingSessionController.get);
router.put('/:id', TradingSessionController.update);
router.delete('/:id', TradingSessionController.delete);

// Analytics
router.get('/analytics/volume', TradingSessionController.getTradeVolumePerSession);
router.get('/analytics/pnl', TradingSessionController.getPnLPerSession);
router.get('/analytics/winrate', TradingSessionController.getWinRatePerSession);
router.get('/analytics/profitfactor', TradingSessionController.getProfitFactorPerSession);
router.get('/analytics/best', TradingSessionController.getBestSession);
router.get('/analytics/worst', TradingSessionController.getWorstSession);
router.get('/analytics/trend/:sessionId', TradingSessionController.getSessionTrend);
router.get('/analytics/compare/:sessionId1/:sessionId2', TradingSessionController.compareSessions);
router.post('/analytics/update-boundaries', TradingSessionController.updateSessionBoundaries);

export default router;