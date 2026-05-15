import db from '../../../models';
import { CreateGoalInput, UpdateGoalInput } from './savingsGoal.schema';

const { SavingsGoal } = db;

export async function createGoal(data: CreateGoalInput) {
  return await SavingsGoal.create(data);
}

export async function updateGoal(id: string, data: UpdateGoalInput) {
  const goal = await SavingsGoal.findByPk(id);
  if (!goal) throw new Error('Goal not found');
  return await goal.update(data);
}

export async function deleteGoal(id: string) {
  const goal = await SavingsGoal.findByPk(id);
  if (!goal) throw new Error('Goal not found');
  await goal.destroy();
  return { message: 'Goal deleted' };
}