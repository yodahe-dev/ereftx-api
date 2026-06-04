import { z } from 'zod';

export const createExpenseCategorySchema = z.object({
  name: z.string().min(1).max(100).transform(s => s.trim().toLowerCase()),
  description: z.string().nullable().optional(),
  parentId: z.string().uuid({ message: 'Invalid parent category ID' }).nullable().optional(),
});

export const updateExpenseCategorySchema = createExpenseCategorySchema.partial().extend({
  id: z.string().uuid(),
});

export const expenseCategoryQuerySchema = z.object({
  includeChildren: z.coerce.boolean().default(false),
  includeParent: z.coerce.boolean().default(false),
  flatList: z.coerce.boolean().default(false), // if true, returns flat array; false returns tree
});

export type CreateExpenseCategoryInput = z.infer<typeof createExpenseCategorySchema>;
export type UpdateExpenseCategoryInput = z.infer<typeof updateExpenseCategorySchema>;
export type ExpenseCategoryQueryInput = z.infer<typeof expenseCategoryQuerySchema>;