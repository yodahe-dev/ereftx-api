// routers/tradingSchedule.router.ts
import { Router } from 'express';
import { TradingScheduleController } from '../controllers/tradingSchedule.controller';

const router = Router();

// CRUD
router.post('/', TradingScheduleController.create);
router.get('/', TradingScheduleController.list);
router.get('/active/:day', TradingScheduleController.getActiveForDay);
router.get('/:id', TradingScheduleController.get);
router.put('/:id', TradingScheduleController.update);
router.delete('/:id', TradingScheduleController.delete);

// Analytics
router.get('/analytics/adherence', TradingScheduleController.getAdherence);
router.get('/analytics/effectiveness', TradingScheduleController.getEffectiveness);
router.get('/analytics/best-day', TradingScheduleController.getBestDay);

export default router;