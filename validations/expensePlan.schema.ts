import { z } from 'zod';

export const ExpensePlanStatusEnum = z.enum(['planned', 'active', 'completed', 'cancelled']);

export const createExpensePlanSchema = z.object({
  title: z.string().min(1).max(150).transform(s => s.trim()),
  targetAmount: z.number().min(0, 'Target amount must be ≥ 0'),
  targetDate: z.coerce.date().nullable().optional(),
  status: ExpensePlanStatusEnum.default('planned'),
  notes: z.string().nullable().optional(),
});

export const updateExpensePlanSchema = createExpensePlanSchema.partial().extend({
  id: z.string().uuid(),
  currentAllocatedAmount: z.number().min(0).optional(), // usually auto-calculated, but allow manual override?
});

export const expensePlanQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),
  status: ExpensePlanStatusEnum.optional(),
  minTargetAmount: z.coerce.number().min(0).optional(),
  maxTargetAmount: z.coerce.number().min(0).optional(),
  startTargetDate: z.coerce.date().optional(),
  endTargetDate: z.coerce.date().optional(),
  sortBy: z.enum(['title', 'targetAmount', 'currentAllocatedAmount', 'targetDate', 'createdAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
  includeExpenses: z.coerce.boolean().default(false),
});

export type CreateExpensePlanInput = z.infer<typeof createExpensePlanSchema>;
export type UpdateExpensePlanInput = z.infer<typeof updateExpensePlanSchema>;
export type ExpensePlanQueryInput = z.infer<typeof expensePlanQuerySchema>;