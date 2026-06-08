import { z } from 'zod';

export const createRecurringExpenseSchema = z.object({
  title: z.string().min(1).max(150),
  categoryId: z.string().uuid(),
  amount: z.number().positive(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']).default('monthly'),
  billingDay: z.number().min(1).max(31).default(1),
  isActive: z.boolean().default(true),
  notes: z.string().nullable().optional(),
});

export const updateRecurringExpenseSchema = createRecurringExpenseSchema
  .partial()
  .extend({ id: z.string().uuid() });

export const recurringExpenseQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().uuid().optional(),
});

export type CreateRecurringExpenseInput = z.infer<typeof createRecurringExpenseSchema>;
export type UpdateRecurringExpenseInput = z.infer<typeof updateRecurringExpenseSchema>;
export type RecurringExpenseListQuery = z.infer<typeof recurringExpenseQuerySchema>;