import { Router } from 'express';
import { ExpenseCategoryController } from '../controllers/expenseCategory.controller';

const router = Router();

router.post('/', ExpenseCategoryController.create);
router.get('/', ExpenseCategoryController.list);
router.get('/:id', ExpenseCategoryController.get);
router.put('/:id', ExpenseCategoryController.update);
router.delete('/:id', ExpenseCategoryController.delete);

export default router;