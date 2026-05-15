// Router/income.router.ts
import { Router } from 'express';
import {
  createIncomeHandler,
  updateIncomeHandler,
  deleteIncomeHandler,
  searchIncomeHandler,
} from '../modules/finance/income/income.controllers';

const router = Router();

router.post('/', createIncomeHandler);
router.get('/search', searchIncomeHandler);
router.put('/:id', updateIncomeHandler);
router.delete('/:id', deleteIncomeHandler);

export default router;