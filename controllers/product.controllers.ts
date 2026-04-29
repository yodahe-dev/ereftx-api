import { Request, Response } from "express";
import { z } from "zod";
import { validate as isUUID } from "uuid";
import { Op } from "sequelize";
import db from "../models";
import {
  createProductService,
  updateProductService,
  addProductPriceService,
  deleteProductService,
} from "../service/product.service";
import {
  createProductSchema,
  updateProductSchema,
  addProductPriceSchema,
} from "../validations/product.schema";

const { Product, ProductPrice } = db;

/**
 * =====================
 * CREATE PRODUCT
 * =====================
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const validated = createProductSchema.parse(req.body);
    const product = await createProductService(validated);
    return res.status(201).json(product);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.flatten());
    }
    console.error("CREATE PRODUCT ERROR:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

/**
 * =====================
 * GET ALL PRODUCTS
 * =====================
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const search = String(req.query.search ?? "").trim();
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const { rows, count } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: ProductPrice,
          as: "prices",
          required: false,
          limit: 1,
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    return res.status(200).json({
      data: rows,
      page,
      hasMore: offset + rows.length < count,
      total: count,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =====================
 * GET BY ID
 * =====================
 */
export const getProductById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    if (!isUUID(id)) return res.status(400).json({ message: "Invalid ID" });

    const product = await Product.findByPk(id, {
      include: [{ model: ProductPrice, as: "prices" }],
    });
    if (!product) return res.status(404).json({ message: "Not found" });

    return res.status(200).json(product);
  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =====================
 * UPDATE PRODUCT
 * =====================
 */
export const updateProduct = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    if (!isUUID(id)) return res.status(400).json({ message: "Invalid ID" });

    const validated = updateProductSchema.parse(req.body);
    const product = await updateProductService(id, validated);
    return res.status(200).json(product);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.flatten());
    }
    console.error("UPDATE PRODUCT ERROR:", error);
    return res.status(400).json({ message: error.message || "Internal server error" });
  }
};

/**
 * =====================
 * ADD PRICE VERSION
 * =====================
 */
export const addProductPrice = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    if (!isUUID(id)) return res.status(400).json({ message: "Invalid ID" });

    const validated = addProductPriceSchema.parse(req.body);
    const price = await addProductPriceService(id, validated);
    return res.status(201).json(price);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.flatten());
    }
    console.error("ADD PRICE ERROR:", error);
    return res.status(400).json({ message: error.message || "Internal server error" });
  }
};

/**
 * =====================
 * DELETE PRODUCT
 * =====================
 */
export const deleteProduct = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    if (!isUUID(id)) return res.status(400).json({ message: "Invalid ID" });

    await deleteProductService(id);
    return res.status(200).json({ message: "Deleted" });
  } catch (error: any) {
    console.error("DELETE PRODUCT ERROR:", error);
    return res.status(400).json({ message: error.message || "Internal server error" });
  }
};