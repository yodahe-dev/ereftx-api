import { z } from 'zod';
import { CreditStatus } from '../../../models/Credit';

export const createCreditSchema = z.object({
  customerId: z.string().uuid(),
  saleId: z.string().uuid().optional(),
  totalAmount: z.coerce.number().positive(),
  paidAmount: z.coerce.number().default(0),
  remainingAmount: z.coerce.number().optional(),
  dueDate: z.coerce.date(),
  status: z.nativeEnum(CreditStatus).default(CreditStatus.PENDING),
  notes: z.string().optional(),
});

export const updateCreditSchema = z.object({
  customerId: z.string().uuid().optional(),
  saleId: z.string().uuid().optional().nullable(),
  totalAmount: z.coerce.number().positive().optional(),
  paidAmount: z.coerce.number().optional(),
  remainingAmount: z.coerce.number().optional(),
  dueDate: z.coerce.date().optional(),
  status: z.nativeEnum(CreditStatus).optional(),
  notes: z.string().optional(),
});

export const creditSearchSchema = z.object({
  query: z.string().optional(),
  customerId: z.string().uuid().optional(),
  status: z.nativeEnum(CreditStatus).optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(['dueDate', 'totalAmount', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateCreditInput = z.infer<typeof createCreditSchema>;
export type UpdateCreditInput = z.infer<typeof updateCreditSchema>;
export type CreditSearchInput = z.infer<typeof creditSearchSchema>;