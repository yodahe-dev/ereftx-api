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

export function createSale(validated: { customerName: string; paymentType: "cash" | "credit"; paymentStatus: "paid" | "pending"; items: { productId: string; quantity: number; unitType: "box" | "single"; customUnitPrice?: number | undefined; }[]; description?: string | null | undefined; }) {
  throw new Error("Function not implemented.");
}
export function updateSale(saleId: string, validated: { customerName?: string | undefined; description?: string | null | undefined; paymentType?: "cash" | "credit" | undefined; paymentStatus?: "paid" | "pending" | undefined; items?: { productId: string; quantity: number; unitType: "box" | "single"; customUnitPrice?: number | undefined; }[] | undefined; }) {
  throw new Error("Function not implemented.");
}

