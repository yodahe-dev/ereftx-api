import { Router } from 'express';
import { SessionController } from '../controllers/session.controller';

const router = Router();

router.get('/current', SessionController.getCurrentSession);
router.post('/refresh', SessionController.refreshSession);
router.get('/schedule', SessionController.getSessionSchedule);

export default router;