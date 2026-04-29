import { z } from "zod";
import { ContainerType } from "../models/Stock";

export const createStockSchema = z.object({
  productId: z.string().uuid(),
  boxQuantity: z.number().int().min(0).default(0),
  singleQuantity: z.number().int().min(0).default(0),
  containerType: z.nativeEnum(ContainerType).default(ContainerType.BOX),
});

export const updateStockSchema = z.object({
  boxQuantity: z.number().int().min(0),
  singleQuantity: z.number().int().min(0),
  containerType: z.nativeEnum(ContainerType).optional(),
});

export const restockSchema = z.object({
  addBoxes: z.number().int().min(0).default(0),
  addSingles: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  isFree: z.boolean().default(false),
});

export const exchangeSchema = z.object({
  sourceProductId: z.string().uuid({ message: "Invalid Source Product ID" }),
  targetProductId: z.string().uuid({ message: "Invalid Target Product ID" }),
  
  exchangeType: z.enum(["box", "single"] as const, {
    message: "Exchange type must be 'box' or 'single'",
  }),

  sourceQuantity: z.number().positive("Quantity must be greater than 0"),

  notes: z.string().max(255).optional(),
});

export type ExchangeInput = z.infer<typeof exchangeSchema>;