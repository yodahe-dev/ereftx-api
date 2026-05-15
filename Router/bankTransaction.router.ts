// Router/bankTransaction.router.ts
import { Router } from 'express';
import { searchTransactionsHandler } from '../modules/finance/bankTransaction/bankTransaction.controllers';

const router = Router();
router.get('/search', searchTransactionsHandler);
export default router;