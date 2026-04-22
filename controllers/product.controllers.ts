import db from "../models";
import { Request, Response } from "express";
import { z } from "zod";
import { validate as isUUID } from "uuid";
import { Transaction, Op } from "sequelize";

const { Product, ProductPrice, sequelize } = db;

/**
 * =====================
 * VALIDATION
 * =====================
 */

const ProductSchema = z.object({
  name: z.string().min(1).max(120),

  categoryId: z.string().uuid(),
  brandId: z.string().uuid(),
  packagingId: z.string().uuid(),

  unitsPerBox: z.number().int().min(1).default(24),

  buyPricePerBox: z.number().nonnegative().optional(),
  sellPricePerBox: z.number().nonnegative().optional(),
  sellPricePerUnit: z.number().nonnegative().optional(),
});

const UpdateProductSchema = ProductSchema.partial();

/**
 * =====================
 * CREATE PRODUCT
 * =====================
 */
export const createProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const transaction: Transaction = await sequelize.transaction();

  try {
    const parsed = ProductSchema.safeParse(req.body);

    if (!parsed.success) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Invalid input",
        errors: parsed.error.flatten(),
      });
    }

    const data = parsed.data;

    const product = await Product.create(
      {
        name: data.name,
        categoryId: data.categoryId,
        brandId: data.brandId,
        packagingId: data.packagingId,
        unitsPerBox: data.unitsPerBox ?? 24,
      },
      { transaction }
    );

    if (
      data.buyPricePerBox !== undefined &&
      data.sellPricePerBox !== undefined &&
      data.sellPricePerUnit !== undefined
    ) {
      await ProductPrice.create(
        {
          productId: product.id,
          buyPricePerBox: data.buyPricePerBox,
          sellPricePerBox: data.sellPricePerBox,
          sellPricePerUnit: data.sellPricePerUnit,
          startAt: new Date(),
          allowLoss: false,
        },
        { transaction }
      );
    }

    await transaction.commit();

    return res.status(201).json(product);
  } catch (error: unknown) {
    await transaction.rollback();
    console.error("CREATE PRODUCT ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * =====================
 * GET ALL PRODUCTS
 * =====================
 */
export const getProducts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const search = String(req.query.search ?? "").trim();

    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.name = {
        [Op.like]: `%${search}%`,
      };
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
  } catch (error: unknown) {
    console.error("GET PRODUCTS ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
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
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!isUUID(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const product = await Product.findByPk(id, {
      include: [{ model: ProductPrice, as: "prices" }],
    });

    if (!product) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.status(200).json(product);
  } catch (error: unknown) {
    console.error("GET PRODUCT ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =====================
 * UPDATE PRODUCT
 * =====================
 */
export const updateProduct = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<Response> => {
  const transaction: Transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    if (!isUUID(id)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid ID" });
    }

    const parsed = UpdateProductSchema.safeParse(req.body);

    if (!parsed.success) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Invalid input",
        errors: parsed.error.flatten(),
      });
    }

    const product = await Product.findByPk(id, { transaction });

    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ message: "Not found" });
    }

    const data = parsed.data;

    await product.update(
      {
        name: data.name ?? product.name,
        categoryId: data.categoryId ?? product.categoryId,
        brandId: data.brandId ?? product.brandId,
        packagingId: data.packagingId ?? product.packagingId,
        unitsPerBox: data.unitsPerBox ?? product.unitsPerBox,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(200).json(product);
  } catch (error: unknown) {
    await transaction.rollback();
    console.error("UPDATE PRODUCT ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =====================
 * ADD PRICE VERSION
 * =====================
 */
export const addProductPrice = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<Response> => {
  const transaction: Transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    if (!isUUID(id)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid ID" });
    }

    const schema = z.object({
      buyPricePerBox: z.number().nonnegative(),
      sellPricePerBox: z.number().nonnegative(),
      sellPricePerUnit: z.number().nonnegative(),
      allowLoss: z.boolean().optional(),
    });

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      await transaction.rollback();
      return res.status(400).json(parsed.error.flatten());
    }

    const product = await Product.findByPk(id, { transaction });

    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    await ProductPrice.update(
      { endAt: new Date() },
      {
        where: {
          productId: id,
          endAt: null,
        },
        transaction,
      }
    );

    const price = await ProductPrice.create(
      {
        productId: id,
        buyPricePerBox: parsed.data.buyPricePerBox,
        sellPricePerBox: parsed.data.sellPricePerBox,
        sellPricePerUnit: parsed.data.sellPricePerUnit,
        startAt: new Date(),
        allowLoss: parsed.data.allowLoss ?? false,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json(price);
  } catch (error: unknown) {
    await transaction.rollback();
    console.error("ADD PRICE ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =====================
 * DELETE PRODUCT
 * =====================
 */
export const deleteProduct = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!isUUID(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Not found" });
    }

    await product.destroy();

    return res.status(200).json({ message: "Deleted" });
  } catch (error: unknown) {
    console.error("DELETE PRODUCT ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};