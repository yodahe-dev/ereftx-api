// modules/finance/bankTransaction/bankTransaction.schema.ts
import { z } from 'zod';
import { TransactionType } from '../../../models/BankTransaction';

export const transactionSearchSchema = z.object({
  query: z.string().optional(),
  bankAccountId: z.string().uuid().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  referenceId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'amount']).default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type TransactionSearchInput = z.infer<typeof transactionSearchSchema>;