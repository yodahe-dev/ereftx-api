import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(120),
  description: z.string().max(500).optional().nullable(),
  brandId: z.string().uuid("Invalid Brand ID format"),
  packagingId: z.string().uuid("Invalid Packaging ID format"),
  unitsPerBox: z.number().int().min(1, "Must have at least 1 unit per box").default(24),
  buyPricePerBox: z.number().nonnegative("Price cannot be negative").optional(),
  sellPricePerBox: z.number().nonnegative("Price cannot be negative").optional(),
  sellPricePerUnit: z.number().nonnegative("Price cannot be negative").optional(),
  allowLoss: z.boolean().optional().default(false),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  brandId: z.string().uuid("Invalid Brand ID format").optional(),
  packagingId: z.string().uuid("Invalid Packaging ID format").optional(),
  unitsPerBox: z.number().int().min(1).optional(),
});

export const addProductPriceSchema = z.object({
  buyPricePerBox: z.number().nonnegative("Price cannot be negative"),
  sellPricePerBox: z.number().nonnegative("Price cannot be negative"),
  sellPricePerUnit: z.number().nonnegative("Price cannot be negative"),
  allowLoss: z.boolean().optional().default(false),
});