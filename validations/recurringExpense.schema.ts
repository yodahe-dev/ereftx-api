import { z } from 'zod';

export const RecurringFrequencyEnum = z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']);

export const createRecurringExpenseSchema = z.object({
  title: z.string().min(1).max(150).transform(s => s.trim()),
  categoryId: z.string().uuid('Invalid category ID'),
  amount: z.number().min(0, 'Amount must be ≥ 0'),
  frequency: RecurringFrequencyEnum.default('monthly'),
  billingDay: z.number().int().min(1).max(31).default(1),
  isActive: z.boolean().default(true),
  notes: z.string().nullable().optional(),
});

export const updateRecurringExpenseSchema = createRecurringExpenseSchema.partial().extend({
  id: z.string().uuid(),
});

export const recurringExpenseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),
  isActive: z.coerce.boolean().optional(),
  categoryId: z.string().uuid().optional(),
  frequency: RecurringFrequencyEnum.optional(),
  sortBy: z.enum(['title', 'amount', 'frequency', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type CreateRecurringExpenseInput = z.infer<typeof createRecurringExpenseSchema>;
export type UpdateRecurringExpenseInput = z.infer<typeof updateRecurringExpenseSchema>;
export type RecurringExpenseQueryInput = z.infer<typeof recurringExpenseQuerySchema>;