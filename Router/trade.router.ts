// routers/trade.router.ts
import { Router } from 'express';
import { TradeController } from '../controllers/trade.controller';
import { AnalyticsController } from '../controllers/trade.analytics.controller'; // adjust path if needed

const router = Router();

// ==================== ANALYTICS (must be FIRST) ====================
router.get('/equity/:accountId', AnalyticsController.getEquityCurve);
router.get('/drawdown/:accountId', AnalyticsController.getDrawdown);
router.get('/winloss/:accountId', AnalyticsController.getWinLossDistribution);
router.get('/risk-reward/:accountId', AnalyticsController.getRiskRewardDistribution);
router.get('/sharpe/:accountId', AnalyticsController.getSharpeRatio);
router.get('/expectancy/:accountId', AnalyticsController.getExpectancy);
router.get('/profitfactor/:accountId', AnalyticsController.getProfitFactor);
router.get('/maxdd/:accountId', AnalyticsController.getMaxDrawdown);
router.get('/session-performance/:accountId', AnalyticsController.getSessionPerformance);
router.get('/best-session/:accountId', AnalyticsController.getBestSession);

// ==================== TRADE CRUD (after analytics) ====================
router.post('/', TradeController.create);
router.get('/', TradeController.list);
router.post('/search', TradeController.search);
router.post('/advanced-search', TradeController.advancedSearch);
router.get('/autocomplete/symbol', TradeController.autoCompleteSymbol);
router.get('/:id', TradeController.get);      // this is the catch‑all – must be last
router.put('/:id', TradeController.update);
router.delete('/:id', TradeController.delete);

export default router;