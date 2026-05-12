import { z } from "zod";

// Enums
export const BoxStateEnum = z.enum(["sold", "returned", "lost"]);
export const ContainerTypeEnum = z.enum(["box", "single"]);
export const BoxTypeEnum = z.enum(["Softdrink", "Beer", "Wine", "liquor", "other"]);

// Item schema for request
export const BoxTransactionItemSchema = z.object({
  boxId: z.string().uuid(),
  type: BoxTypeEnum,
  conternertype: ContainerTypeEnum,
  quantity: z.number().int().positive(),
  states: BoxStateEnum,
  price: z.number().positive().multipleOf(0.01),
});

// Create transaction schema
export const CreateBoxTransactionSchema = z.object({
  customername: z.string().min(1).max(120).trim(),
  customerphone: z.string().min(1).max(20).trim(),
  customermoney: z.number().min(0).multipleOf(0.01).default(0),
  note: z.string().optional().default(""),
  items: z.array(BoxTransactionItemSchema).min(1),
});

// Update transaction header schema
export const UpdateBoxTransactionSchema = z.object({
  customername: z.string().min(1).max(120).trim().optional(),
  customerphone: z.string().min(1).max(20).trim().optional(),
  customermoney: z.number().min(0).multipleOf(0.01).optional(),
  note: z.string().optional(),
});

// Add/Update item schemas
export const AddItemSchema = z.object({
  boxId: z.string().uuid(),
  type: BoxTypeEnum,
  conternertype: ContainerTypeEnum,
  quantity: z.number().int().positive(),
  states: BoxStateEnum,
  price: z.number().positive().multipleOf(0.01),
});

export const UpdateItemSchema = z.object({
  quantity: z.number().int().positive().optional(),
  states: BoxStateEnum.optional(),
  price: z.number().positive().multipleOf(0.01).optional(),
});

// Query filters schema
export const BoxTransactionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "customername", "soldmoney", "profit"]).default("createdAt"),
  sortOrder: z.enum(["ASC", "DESC"]).default("DESC"),
  search: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  state: BoxStateEnum.optional(),
  boxId: z.string().uuid().optional(),
});