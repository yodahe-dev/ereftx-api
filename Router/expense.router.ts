import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';

const router = Router();

router.post('/', ExpenseController.create);
router.get('/', ExpenseController.list);
router.get('/summary', ExpenseController.summary);
router.get('/:id', ExpenseController.get);
router.put('/:id', ExpenseController.update);
router.delete('/:id', ExpenseController.delete);

export default router;