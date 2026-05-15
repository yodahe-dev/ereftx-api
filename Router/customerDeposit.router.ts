// Router/customerDeposit.router.ts
import { Router } from 'express';
import {
  createDepositHandler,
  updateDepositHandler,
  deleteDepositHandler,
  searchDepositsHandler,
} from '../modules/finance/customerDeposit/customerDeposit.controllers';

const router = Router();
router.post('/', createDepositHandler);
router.get('/search', searchDepositsHandler);
router.put('/:id', updateDepositHandler);
router.delete('/:id', deleteDepositHandler);
export default router;