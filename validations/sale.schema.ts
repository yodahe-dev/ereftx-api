import { z } from "zod";

export const createSaleItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  unitType: z.enum(["box", "single"], { message: "Must be 'box' or 'single'" }),
  customUnitPrice: z.number().nonnegative().optional(),
});

export const createSaleSchema = z.object({
  customerName: z.string().min(1, "Customer name is required").max(120),
  description: z.string().max(500).nullable().optional(),
  paymentType: z.enum(["cash", "credit"], { message: "Must be 'cash' or 'credit'" }),
  paymentStatus: z.enum(["paid", "pending"]).optional().default("paid"),
  items: z.array(createSaleItemSchema).min(1, "At least one item is required"),
});

export const updateSaleSchema = z.object({
  customerName: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  paymentType: z.enum(["cash", "credit"]).optional(),
  paymentStatus: z.enum(["paid", "pending"]).optional(),
  items: z.array(createSaleItemSchema).min(1).optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;