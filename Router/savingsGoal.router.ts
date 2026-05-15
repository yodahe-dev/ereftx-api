// Router/savingsGoal.router.ts
import { Router } from 'express';
import {
  createGoalHandler,
  updateGoalHandler,
  deleteGoalHandler,
  searchGoalsHandler,
} from '../modules/finance/savingsGoal/savingsGoal.controllers';

const router = Router();
router.post('/', createGoalHandler);
router.get('/search', searchGoalsHandler);
router.put('/:id', updateGoalHandler);
router.delete('/:id', deleteGoalHandler);
export default router;