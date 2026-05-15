import { z } from 'zod';
import { IncomeSource } from '../../../models/Income';

export const createIncomeSchema = z.object({
  bankAccountId: z.string().uuid(),
  source: z.nativeEnum(IncomeSource),
  amount: z.coerce.number().positive(),
  description: z.string().max(200).optional(),
  referenceId: z.string().uuid().optional(),
  receivedDate: z.coerce.date().default(() => new Date()),
  notes: z.string().optional(),
});

export const updateIncomeSchema = z.object({
  bankAccountId: z.string().uuid().optional(),
  source: z.nativeEnum(IncomeSource).optional(),
  amount: z.coerce.number().positive().optional(),
  description: z.string().max(200).optional(),
  referenceId: z.string().uuid().optional(),
  receivedDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const incomeSearchSchema = z.object({
  query: z.string().optional(),
  bankAccountId: z.string().uuid().optional(),
  source: z.nativeEnum(IncomeSource).optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(['receivedDate', 'amount', 'source']).default('receivedDate'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
export type IncomeSearchInput = z.infer<typeof incomeSearchSchema>;