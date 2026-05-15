import { Router } from 'express';
import {
  createCreditHandler,
  updateCreditHandler,
  deleteCreditHandler,
  searchCreditsHandler,
} from '../modules/finance/credit/credit.controllers';

const router = Router();
router.post('/', createCreditHandler);
router.get('/search', searchCreditsHandler);
router.put('/:id', updateCreditHandler);
router.delete('/:id', deleteCreditHandler);
export default router;