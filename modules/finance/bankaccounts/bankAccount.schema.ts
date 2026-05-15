// modules/finance/bankaccounts/bankAccount.schema.ts
import { z } from 'zod';
import { AccountType } from '../../../models/BankAccount';

// strict numeric transformer – rejects any non‑numeric characters
const strictPositiveNumber = z
  .string()
  .transform((val, ctx) => {
    const trimmed = val.trim();
    if (trimmed === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Amount is required' });
      return z.NEVER;
    }
    if (!/^\d+(\.\d+)?$/.test(trimmed)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Only digits and a decimal point are allowed' });
      return z.NEVER;
    }
    const num = Number(trimmed);
    if (isNaN(num) || num <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Must be a positive number' });
      return z.NEVER;
    }
    return num;
  });

export const createBankAccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(AccountType),
  bankName: z.string().optional().transform(val => (val?.trim() === '' ? undefined : val)),
  accountNumber: z.string().optional().transform(val => (val?.trim() === '' ? undefined : val)),
  balance: z.coerce.number().min(0).default(0),
});

export const updateBankAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.nativeEnum(AccountType).optional(),
  bankName: z.string().optional().nullable().transform(val => (val?.trim() === '' ? null : val)),
  accountNumber: z.string().optional().nullable().transform(val => (val?.trim() === '' ? null : val)),
  balance: z.coerce.number().min(0).optional(),
});

export const bankAccountSearchSchema = z.object({
  query: z.string().optional(),
  type: z.nativeEnum(AccountType).optional(),
  minBalance: z.coerce.number().min(0).optional(),
  maxBalance: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['name', 'balance', 'createdAt', 'type']).optional().default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// New deposit / withdrawal schemas
export const depositSchema = z.object({
  amount: strictPositiveNumber,
  description: z.string().max(200).optional(),
});

export const withdrawSchema = z.object({
  amount: strictPositiveNumber,
  description: z.string().max(200).optional(),
});

export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>;
export type BankAccountSearchInput = z.infer<typeof bankAccountSearchSchema>;
export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;