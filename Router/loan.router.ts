import { Router } from 'express';
import {
  createLoanHandler,
  updateLoanHandler,
  deleteLoanHandler,
  searchLoansHandler,
} from '../modules/finance/loan/loan.controllers';

const router = Router();
router.post('/', createLoanHandler);
router.get('/search', searchLoansHandler);
router.put('/:id', updateLoanHandler);
router.delete('/:id', deleteLoanHandler);
export default router;