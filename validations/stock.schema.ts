import { z } from "zod";

export const exchangeSchema = z.object({
  sourceProductId: z.string().uuid({ message: "Invalid Source Product ID" }),
  targetProductId: z.string().uuid({ message: "Invalid Target Product ID" }),
  
  exchangeType: z.enum(["box", "single"] as const, {
    message: "Exchange type must be 'box' or 'single'",
  }),

  sourceQuantity: z.number().positive("Quantity must be greater than 0"),

  notes: z.string().max(255).optional(),
});

export const restockSchema = z.object({
  productId: z.string().uuid(),
  boxQuantity: z.number().min(0).default(0),
  singleQuantity: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export type ExchangeInput = z.infer<typeof exchangeSchema>;