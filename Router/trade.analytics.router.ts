// routers/trade.analytics.router.ts
import { Router } from 'express';
import { AnalyticsController } from '../controllers/trade.analytics.controller';

const router = Router();

router.get('/trade/equity/:accountId', AnalyticsController.getEquityCurve);
router.get('/trade/drawdown/:accountId', AnalyticsController.getDrawdown);
router.get('/trade/winloss/:accountId', AnalyticsController.getWinLossDistribution);
router.get('/trade/sharpe/:accountId', AnalyticsController.getSharpeRatio);
router.get('/trade/expectancy/:accountId', AnalyticsController.getExpectancy);
router.get('/trade/profitfactor/:accountId', AnalyticsController.getProfitFactor);
router.get('/trade/maxdd/:accountId', AnalyticsController.getMaxDrawdown);
router.get('/trade/session-performance/:accountId', AnalyticsController.getSessionPerformance);
router.get('/trade/best-session/:accountId', AnalyticsController.getBestSession);
router.get('/trade/risk-reward/:accountId', AnalyticsController.getRiskRewardDistribution);

export default router;