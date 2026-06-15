import { Request, Response } from "express";
import { z } from "zod";
import { validate as isUUID } from "uuid";
import {
  createPriceService,
  getPricesByProductService,
  updatePriceService,
  deletePriceService,
  activatePriceService,
} from "../service/priceHistory.service";

const createPriceSchema = z.object({
  productId: z.string().uuid(),
  buyPricePerBox: z.number().positive(),
  sellPricePerBox: z.number().positive(),
  sellPricePerUnit: z.number().positive(),
  allowLoss: z.boolean().default(false),
  startAt: z.string().datetime().optional(),
});

const updatePriceSchema = z.object({
  buyPricePerBox: z.number().positive().optional(),
  sellPricePerBox: z.number().positive().optional(),
  sellPricePerUnit: z.number().positive().optional(),
  allowLoss: z.boolean().optional(),
  endAt: z.string().datetime().nullable().optional(),
});

export const createPrice = async (req: Request, res: Response) => {
  try {
    const validated = createPriceSchema.parse(req.body);
    const price = await createPriceService(validated);
    return res.status(201).json(price);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.flatten());
    }
    console.error("CREATE PRICE ERROR:", error);
    return res.status(400).json({ message: error.message || "Internal server error" });
  }
};

export const getPricesByProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    if (!isUUID(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }
    const prices = await getPricesByProductService(productId as string);
    return res.status(200).json(prices);
  } catch (error: any) {
    console.error("GET PRICES ERROR:", error);
    return res.status(400).json({ message: error.message || "Internal server error" });
  }
};

export const updatePrice = async (req: Request, res: Response) => {
  try {
    const { priceId } = req.params;
    if (!isUUID(priceId)) {
      return res.status(400).json({ message: "Invalid priceId" });
    }
    const validated = updatePriceSchema.parse(req.body);
    const updated = await updatePriceService(priceId as string, validated);
    return res.status(200).json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.flatten());
    }
    console.error("UPDATE PRICE ERROR:", error);
    return res.status(400).json({ message: error.message || "Internal server error" });
  }
};

export const deletePrice = async (req: Request, res: Response) => {
  try {
    const { priceId } = req.params;
    if (!isUUID(priceId)) {
      return res.status(400).json({ message: "Invalid priceId" });
    }
    await deletePriceService(priceId as string);
    return res.status(200).json({ message: "Price deleted successfully" });
  } catch (error: any) {
    console.error("DELETE PRICE ERROR:", error);
    return res.status(400).json({ message: error.message || "Internal server error" });
  }
};

export const activatePrice = async (req: Request, res: Response) => {
  try {
    const { priceId } = req.params;
    if (!isUUID(priceId)) {
      return res.status(400).json({ message: "Invalid priceId" });
    }
    const { productId } = req.body;
    if (!productId || !isUUID(productId)) {
      return res.status(400).json({ message: "productId is required" });
    }
    const activated = await activatePriceService(priceId as string, productId);
    return res.status(200).json(activated);
  } catch (error: any) {
    console.error("ACTIVATE PRICE ERROR:", error);
    return res.status(400).json({ message: error.message || "Internal server error" });
  }
};