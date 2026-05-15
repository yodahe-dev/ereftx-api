import { Router } from 'express';
import {
  createCustomerHandler,
  updateCustomerHandler,
  deleteCustomerHandler,
  searchCustomersHandler,
} from '../modules/finance/customer/customer.controllers';

const router = Router();
router.post('/', createCustomerHandler);
router.get('/search', searchCustomersHandler);
router.put('/:id', updateCustomerHandler);
router.delete('/:id', deleteCustomerHandler);
export default router;