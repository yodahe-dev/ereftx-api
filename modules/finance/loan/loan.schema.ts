import { z } from 'zod';
import { LoanType, LoanStatus } from '../../../models/Loan';

export const createLoanSchema = z.object({
  type: z.nativeEnum(LoanType),
  counterpartyName: z.string().min(1).max(150),
  counterpartyId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid(),
  principalAmount: z.coerce.number().positive(),
  interestRate: z.coerce.number().min(0).default(0),
  startDate: z.coerce.date(),
  expectedEndDate: z.coerce.date(),
  notes: z.string().optional(),
});

export const updateLoanSchema = z.object({
  type: z.nativeEnum(LoanType).optional(),
  counterpartyName: z.string().min(1).max(150).optional(),
  counterpartyId: z.string().uuid().optional().nullable(),
  bankAccountId: z.string().uuid().optional(),
  principalAmount: z.coerce.number().positive().optional(),
  interestRate: z.coerce.number().min(0).optional(),
  startDate: z.coerce.date().optional(),
  expectedEndDate: z.coerce.date().optional(),
  actualEndDate: z.coerce.date().optional().nullable(),
  totalRepaid: z.coerce.number().optional(),
  status: z.nativeEnum(LoanStatus).optional(),
  notes: z.string().optional(),
});

export const loanSearchSchema = z.object({
  query: z.string().optional(),
  bankAccountId: z.string().uuid().optional(),
  type: z.nativeEnum(LoanType).optional(),
  status: z.nativeEnum(LoanStatus).optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(['startDate', 'principalAmount', 'status']).default('startDate'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type UpdateLoanInput = z.infer<typeof updateLoanSchema>;
export type LoanSearchInput = z.infer<typeof loanSearchSchema>;