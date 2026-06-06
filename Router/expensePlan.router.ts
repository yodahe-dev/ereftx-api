import { Router } from 'express';
import { ExpensePlanController } from '../controllers/expensePlan.controller';

const router = Router();

router.post('/', ExpensePlanController.create);
router.get('/', ExpensePlanController.list);
router.get('/auto-cancel-overdue', ExpensePlanController.autoCancelOverdue);
router.get('/:id', ExpensePlanController.get);
router.put('/:id', ExpensePlanController.update);
router.delete('/:id', ExpensePlanController.delete);
router.post('/:id/refresh-allocation', ExpensePlanController.refreshAllocation);

export default router;