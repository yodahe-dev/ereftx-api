import db from "../models";
import { Request, Response } from "express";
import { z } from "zod";
import { validate as isUUID } from "uuid";

const { Product } = db;

const ProductSchema = z.object({
  name: z.string().min(1).max(150),

  categoryId: z.string().uuid(),
  brandId: z.string().uuid(),
  packagingId: z.string().uuid(),

  bottlesPerBox: z.number().int().min(1).optional(),

  boxBuyPrice: z.number().nonnegative().optional(),
  boxSellPrice: z.number().nonnegative().optional(),
  singleSellPrice: z.number().nonnegative().optional(),
});

const UpdateProductSchema = ProductSchema.partial();

/**
 * =====================
 * CREATE PRODUCT
 * =====================
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const parsed = ProductSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: parsed.error.flatten(),
      });
    }

    const data = parsed.data;

    // ✅ FIX: remove undefined properly (STRICT TYPE SAFE)
    const productPayload: any = {
      name: data.name,
      categoryId: data.categoryId,
      brandId: data.brandId,
      packagingId: data.packagingId,
      bottlesPerBox: data.bottlesPerBox ?? 24,
    };

    // only add numbers if they exist
    if (data.boxBuyPrice !== undefined) {
      productPayload.boxBuyPrice = data.boxBuyPrice;
    }

    if (data.boxSellPrice !== undefined) {
      productPayload.boxSellPrice = data.boxSellPrice;
    }

    if (data.singleSellPrice !== undefined) {
      productPayload.singleSellPrice = data.singleSellPrice;
    }

    const product = await Product.create(productPayload);

    return res.status(201).json(product);
  } catch (error: unknown) {
    console.error("CREATE PRODUCT ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * =====================
 * GET ALL
 * =====================
 */
export const getProducts = async (_: Request, res: Response) => {
  try {
    const products = await Product.findAll();
    return res.status(200).json(products);
  } catch (error: unknown) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * =====================
 * GET BY ID
 * =====================
 */
export const getProductById = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!isUUID(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.status(200).json(product);
  } catch (error: unknown) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * =====================
 * UPDATE
 * =====================
 */
export const updateProduct = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!isUUID(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const parsed = UpdateProductSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: parsed.error.flatten(),
      });
    }

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Not found" });
    }

    const data = parsed.data;

    // FIX same issue for update
    const updatePayload: any = {
      ...data,
    };

    await product.update(updatePayload);

    return res.status(200).json(product);
  } catch (error: unknown) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * =====================
 * DELETE
 * =====================
 */
export const deleteProduct = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!isUUID(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Not found" });
    }

    await product.destroy();

    return res.status(200).json({ message: "Deleted" });
  } catch (error: unknown) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};