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

  // Price handling
  priceId: z.string().uuid().optional(),
  newBuyPricePerBox: z.number().positive().optional(),
  newSellPricePerBox: z.number().positive().optional(),
  newSellPricePerUnit: z.number().positive().optional(),
}).refine(
  (data) => !(data.priceId && data.newBuyPricePerBox),
  { message: "Provide either priceId OR newBuyPricePerBox, not both" }
);

export const exchangeSchema = z.object({
  sourceProductId: z.string().uuid(),
  targetProductId: z.string().uuid(),
  exchangeType: z.enum(["box", "single"]),
  sourceQuantity: z.number().positive(),
  notes: z.string().max(255).optional(),
});


export type ExchangeInput = z.infer<typeof exchangeSchema>;