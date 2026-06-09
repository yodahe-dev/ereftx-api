// routers/trade.router.ts
import { Router } from 'express';
import { TradeController } from '../controllers/trade.controller';
import { AnalyticsController } from '../controllers/trade.analytics.controller';

const router = Router();

router.post('/', TradeController.create);
router.get('/', TradeController.list);
router.post('/search', TradeController.search);
router.post('/advanced-search', TradeController.advancedSearch);
router.get('/autocomplete/symbol', TradeController.autoCompleteSymbol);
router.get('/:id', TradeController.get);
router.put('/:id', TradeController.update);
router.delete('/:id', TradeController.delete);


router.get('/equity/:accountId', AnalyticsController.getEquityCurve);
router.get('/drawdown/:accountId', AnalyticsController.getDrawdown);
router.get('/winloss/:accountId', AnalyticsController.getWinLossDistribution);
router.get('/sharpe/:accountId', AnalyticsController.getSharpeRatio);
router.get('/expectancy/:accountId', AnalyticsController.getExpectancy);
router.get('/profitfactor/:accountId', AnalyticsController.getProfitFactor);
router.get('/maxdd/:accountId', AnalyticsController.getMaxDrawdown);
router.get('/session-performance/:accountId', AnalyticsController.getSessionPerformance);
router.get('/best-session/:accountId', AnalyticsController.getBestSession);
router.get('/risk-reward/:accountId', AnalyticsController.getRiskRewardDistribution);
export default router;