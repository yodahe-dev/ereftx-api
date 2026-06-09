// routers/tradePlan.router.ts
import { Router } from 'express';
import { TradePlanController } from '../controllers/tradePlan.controller';

const router = Router();

// CRUD
router.post('/', TradePlanController.create);
router.get('/', TradePlanController.list);
router.get('/:id', TradePlanController.get);
router.put('/:id', TradePlanController.update);
router.delete('/:id', TradePlanController.delete);

// Analytics
router.get('/analytics/activity', TradePlanController.getPlanActivity);
router.get('/analytics/adherence/:accountId', TradePlanController.getPlanAdherence);
router.get('/analytics/winrate/:accountId', TradePlanController.getPlanWinRate);
router.get('/analytics/status/:accountId', TradePlanController.getPlanStatusDistribution);
router.get('/analytics/best/:accountId', TradePlanController.getBestPlan);
router.get('/analytics/worst/:accountId', TradePlanController.getWorstPlan);
router.get('/analytics/deviation/:accountId', TradePlanController.getAverageDeviation);

export default router;