// modules/finance/expense/expense.schema.ts
import { z } from 'zod';
import { ExpenseCategory, ExpenseFrequency } from '../../../models/Expense';

export const createExpenseSchema = z.object({
  bankAccountId: z.string().uuid(),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(1).max(200),
  amount: z.coerce.number().positive(),
  isScheduled: z.boolean().default(false),
  scheduledDate: z.coerce.date().optional(),
  frequency: z.nativeEnum(ExpenseFrequency).default(ExpenseFrequency.ONE_TIME),
  isPaid: z.boolean().default(false),         // if true, we deduct immediately
  notes: z.string().optional(),
  loanId: z.string().uuid().optional(),
});

export const updateExpenseSchema = z.object({
  bankAccountId: z.string().uuid().optional(),
  category: z.nativeEnum(ExpenseCategory).optional(),
  description: z.string().min(1).max(200).optional(),
  amount: z.coerce.number().positive().optional(),
  isScheduled: z.boolean().optional(),
  scheduledDate: z.coerce.date().optional(),
  frequency: z.nativeEnum(ExpenseFrequency).optional(),
  isPaid: z.boolean().optional(),
  notes: z.string().optional(),
  loanId: z.string().uuid().optional(),
});

export const expenseSearchSchema = z.object({
  query: z.string().optional(),
  bankAccountId: z.string().uuid().optional(),
  category: z.nativeEnum(ExpenseCategory).optional(),
  isPaid: z.coerce.boolean().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(['createdAt', 'amount', 'description', 'category']).default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseSearchInput = z.infer<typeof expenseSearchSchema>;