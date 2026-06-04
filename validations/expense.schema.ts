import { z } from 'zod';

export const ExpenseReferenceTypeEnum = z.enum(['stock', 'personal', 'recurring', 'general', 'plan']);

export const createExpenseSchema = z.object({
  title: z.string().min(1).max(150).transform(s => s.trim()),
  amount: z.number().positive().min(0.01),
  expenseDate: z.coerce.date().optional().default(() => new Date()),
  categoryId: z.string().uuid({ message: 'Invalid category ID' }),
  recurringExpenseId: z.string().uuid().nullable().optional(),
  expensePlanId: z.string().uuid().nullable().optional(),
  productId: z.string().uuid().nullable().optional(),
  referenceType: ExpenseReferenceTypeEnum.default('general'),
  notes: z.string().nullable().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial().extend({
  id: z.string().uuid(),
});

export const expenseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  categoryId: z.string().uuid().optional(),
  referenceType: ExpenseReferenceTypeEnum.optional(),
  productId: z.string().uuid().optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  sortBy: z.enum(['expenseDate', 'amount', 'createdAt']).default('expenseDate'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>;