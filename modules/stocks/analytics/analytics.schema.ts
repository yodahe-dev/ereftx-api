import { z } from "zod";

export const salesAnalyticsSchema = z.object({
  groupBy: z.enum(["day", "week", "month", "year"]).default("day"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  productId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
});

export const stockMovementSchema = z.object({
  productId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  interval: z.enum(["day", "week", "month"]).default("day"),
});

export const topProductsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  days: z.coerce.number().int().min(1).max(365).default(30),
  sortBy: z.enum(["quantity", "revenue", "profit"]).default("quantity"),
});

export type SalesAnalyticsInput = z.infer<typeof salesAnalyticsSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
export type TopProductsInput = z.infer<typeof topProductsSchema>;