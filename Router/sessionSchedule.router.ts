// routers/sessionSchedule.router.ts
import { Router } from 'express';
import { SessionScheduleController } from '../controllers/sessionSchedule.controller';

const router = Router();

router.post('/', SessionScheduleController.create);
router.get('/', SessionScheduleController.list);
router.get('/current/:sessionId', SessionScheduleController.getCurrentForSession);
router.get('/:id', SessionScheduleController.get);
router.put('/:id', SessionScheduleController.update);
router.delete('/:id', SessionScheduleController.delete);

export default router;