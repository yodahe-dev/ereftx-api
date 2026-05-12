import { z } from "zod";

export const BoxTypeEnum = z.enum(["Softdrink", "Beer", "Wine", "liquor", "other"]);

// Create/Update schemas
export const CreateBoxSchema = z.object({
  catagroryId: z.string().uuid().nullable().optional(),
  type: BoxTypeEnum,
  boxbuyingPrice: z.number().positive().multipleOf(0.01),
  boxSellingPrice: z.number().positive().multipleOf(0.01),
  boxQuantity: z.number().int().positive(),
  boxCurentPrice: z.number().positive().multipleOf(0.01),
  boxCurrentQuantity: z.number().int().min(0),
});

export const UpdateBoxSchema = z.object({
  catagroryId: z.string().uuid().nullable().optional(),
  type: BoxTypeEnum.optional(),
  boxbuyingPrice: z.number().positive().multipleOf(0.01).optional(),
  boxSellingPrice: z.number().positive().multipleOf(0.01).optional(),
  boxQuantity: z.number().int().positive().optional(),
  boxCurentPrice: z.number().positive().multipleOf(0.01).optional(),
  boxCurrentQuantity: z.number().int().min(0).optional(),
});

// Bulk update inventory (for restocking, adjustments)
export const BulkUpdateInventorySchema = z.object({
  updates: z.array(z.object({
    id: z.string().uuid(),
    boxCurrentQuantity: z.number().int().min(0),
  })),
});

// Query filters
export const BoxQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "type", "boxbuyingPrice", "boxSellingPrice", "boxCurrentQuantity"]).default("createdAt"),
  sortOrder: z.enum(["ASC", "DESC"]).default("DESC"),
  search: z.string().optional(),
  type: BoxTypeEnum.optional(),
  catagroryId: z.string().uuid().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minQuantity: z.coerce.number().int().min(0).optional(),
  maxQuantity: z.coerce.number().int().min(0).optional(),
});