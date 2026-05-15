import { z } from 'zod';
import { GoalStatus } from '../../../models/SavingsGoal';

export const createGoalSchema = z.object({
  bankAccountId: z.string().uuid(),
  name: z.string().min(1).max(150),
  targetAmount: z.coerce.number().positive(),
  currentAmount: z.coerce.number().default(0),
  deadline: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const updateGoalSchema = z.object({
  bankAccountId: z.string().uuid().optional(),
  name: z.string().min(1).max(150).optional(),
  targetAmount: z.coerce.number().positive().optional(),
  currentAmount: z.coerce.number().optional(),
  deadline: z.coerce.date().optional().nullable(),
  status: z.nativeEnum(GoalStatus).optional(),
  notes: z.string().optional(),
});

export const goalSearchSchema = z.object({
  query: z.string().optional(),
  bankAccountId: z.string().uuid().optional(),
  status: z.nativeEnum(GoalStatus).optional(),
  sortBy: z.enum(['deadline', 'targetAmount', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type GoalSearchInput = z.infer<typeof goalSearchSchema>;