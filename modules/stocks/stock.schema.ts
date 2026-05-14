import { z } from "zod";
import { ContainerType } from "../../models/Stock";
import { HistoryActionType } from "../../models/StockHistory";

// ---------- Stock ----------
export const createStockSchema = z.object({
  productId: z.string().uuid(),
  boxQuantity: z.number().int().min(0).default(0),
  singleQuantity: z.number().int().min(0).default(0),
  containerType: z.nativeEnum(ContainerType).default(ContainerType.BOX),
});

export const updateStockSchema = z.object({
  boxQuantity: z.number().int().min(0).optional(),
  singleQuantity: z.number().int().min(0).optional(),
  containerType: z.nativeEnum(ContainerType).optional(),
  notes: z.string().optional(),
});

export const restockSchema = z.object({
  addBoxes: z.number().int().min(0).default(0),
  addSingles: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  isFree: z.boolean().default(false),
  newBuyPricePerBox: z.number().min(0).optional(),
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

// ---------- Stock History ----------
export const updateStockHistorySchema = z.object({
  actionType: z.nativeEnum(HistoryActionType).optional(),
  boxQuantityBefore: z.number().int().optional(),
  singleQuantityBefore: z.number().int().optional(),
  boxQuantityAfter: z.number().int().optional(),
  singleQuantityAfter: z.number().int().optional(),
  boxQuantityChange: z.number().int().optional(),
  singleQuantityChange: z.number().int().optional(),
  notes: z.string().nullable().optional(),
  isFree: z.boolean().optional(),
  saleId: z.string().uuid().nullable().optional(),
  // priceId is rarely changed manually, but allowed if needed
  priceId: z.string().uuid().optional(),
});

// ---------- Product Price ----------
export const createProductPriceSchema = z.object({
  productId: z.string().uuid(),
  buyPricePerBox: z.number().min(0).default(0),
  sellPricePerBox: z.number().min(0).default(0),
  sellPricePerUnit: z.number().min(0).default(0),
  allowLoss: z.boolean().default(false),
  startAt: z.coerce.date().optional(),   // defaults to now
});

export const updateProductPriceSchema = z.object({
  buyPricePerBox: z.number().min(0).optional(),
  sellPricePerBox: z.number().min(0).optional(),
  sellPricePerUnit: z.number().min(0).optional(),
  allowLoss: z.boolean().optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().nullable().optional(),
});