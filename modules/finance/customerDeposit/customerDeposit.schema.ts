import { z } from 'zod';
import { DepositStatus } from '../../../models/CustomerDeposit';

export const createDepositSchema = z.object({
  customerId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  remainingAmount: z.coerce.number().optional(),
  status: z.nativeEnum(DepositStatus).default(DepositStatus.HELD),
  relatedSaleId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const updateDepositSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  remainingAmount: z.coerce.number().optional(),
  status: z.nativeEnum(DepositStatus).optional(),
  relatedSaleId: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
});

export const depositSearchSchema = z.object({
  query: z.string().optional(),
  customerId: z.string().uuid().optional(),
  status: z.nativeEnum(DepositStatus).optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  sortBy: z.enum(['createdAt', 'amount']).default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateDepositInput = z.infer<typeof createDepositSchema>;
export type UpdateDepositInput = z.infer<typeof updateDepositSchema>;
export type DepositSearchInput = z.infer<typeof depositSearchSchema>;