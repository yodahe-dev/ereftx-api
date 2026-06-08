import { Router } from 'express';
import { RecurringExpenseController } from '../controllers/recurringExpense.controller';

const router = Router();

router.post('/', RecurringExpenseController.create);
router.get('/', RecurringExpenseController.list);
router.post('/generate', RecurringExpenseController.generateNow); // changed to POST for mutation + dry-run query
router.get('/duplicates', RecurringExpenseController.findDuplicates); // NEW: duplicate check
router.get('/:id', RecurringExpenseController.get);
router.get('/:id/preview', RecurringExpenseController.preview);
router.put('/:id', RecurringExpenseController.update);
router.delete('/:id', RecurringExpenseController.delete);
router.post('/:id/backfill', RecurringExpenseController.backfill);

export default router;