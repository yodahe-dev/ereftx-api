import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  totalCreditLimit: z.coerce.number().min(0).default(0),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  totalCreditLimit: z.coerce.number().min(0).optional(),
});

export const customerSearchSchema = z.object({
  query: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt']).default('name'),
  sortOrder: z.enum(['ASC', 'DESC']).default('ASC'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerSearchInput = z.infer<typeof customerSearchSchema>;