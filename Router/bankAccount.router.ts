// Router/bankAccount.router.ts
import { Router } from 'express';
import {
  createAccount,
  getAccount,
  updateAccount,
  deleteAccount,
  searchAccounts,
} from '../modules/finance/bankaccounts/bankAccount.controllers';

const router = Router();

router.post('/', createAccount);
router.get('/search', searchAccounts);      // advanced fuzzy search with typo handling
router.get('/:id', getAccount);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;