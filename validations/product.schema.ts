import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1).max(120),
  categoryId: z.string().uuid(),
  brandId: z.string().uuid(),
  packagingId: z.string().uuid(),
  unitsPerBox: z.number().int().min(1).default(24),
  // Prices are optional during creation; service will create a default zero‑price if missing
  buyPricePerBox: z.number().nonnegative().optional(),
  sellPricePerBox: z.number().nonnegative().optional(),
  sellPricePerUnit: z.number().nonnegative().optional(),
  allowLoss: z.boolean().optional().default(false),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  packagingId: z.string().uuid().optional(),
  unitsPerBox: z.number().int().min(1).optional(),
});

export const addProductPriceSchema = z.object({
  buyPricePerBox: z.number().nonnegative(),
  sellPricePerBox: z.number().nonnegative(),
  sellPricePerUnit: z.number().nonnegative(),
  allowLoss: z.boolean().optional().default(false),
});