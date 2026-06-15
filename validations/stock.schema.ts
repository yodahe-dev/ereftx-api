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
  priceId: z.string().uuid().optional(),
});

export const assignPriceToStockSchema = z.object({
  priceId: z.string().uuid(),
  boxQuantity: z.number().int().min(0),
  singleQuantity: z.number().int().min(0),
  notes: z.string().optional(),
});

export const exchangeSchema = z.object({
  sourceProductId: z.string().uuid(),
  targetProductId: z.string().uuid(),
  exchangeType: z.enum(["box", "single"]),
  sourceQuantity: z.number().positive(),
  notes: z.string().max(255).optional(),
});