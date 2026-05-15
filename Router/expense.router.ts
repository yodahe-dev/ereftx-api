// Router/expense.router.ts
import { Router } from 'express';
import {
  createExpenseHandler,
  updateExpenseHandler,
  deleteExpenseHandler,
  searchExpensesHandler,
} from '../modules/finance/expense/expense.controllers';

const router = Router();

router.post('/', createExpenseHandler);
router.get('/search', searchExpensesHandler);
router.put('/:id', updateExpenseHandler);
router.delete('/:id', deleteExpenseHandler);

export default router;