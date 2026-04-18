import db from "../models";
import { Request, Response } from "express";
import { z } from "zod";
import { validate as isUUID } from "uuid";
import { Transaction } from "sequelize";

const { Product, sequelize } = db;

/**
 * =====================
 * VALIDATION
 * =====================
 */
const ProductSchema = z.object({
  name: z.string().min(1).max(150),

  sku: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),

  isActive: z.boolean().optional().default(true),

  categoryId: z.string().uuid(),
  brandId: z.string().uuid(),
  packagingId: z.string().uuid(),

  bottlesPerBox: z.number().int().min(1).optional().default(24),

  boxBuyPrice: z.number().nonnegative(),
  boxSellPrice: z.number().nonnegative(),
  singleSellPrice: z.number().nonnegative(),

  priceStartDate: z.coerce.date().optional(),
  priceEndDate: z.coerce.date().nullable().optional(),
});

const UpdateProductSchema = ProductSchema.partial();

/**
 * =====================
 * HELPER: Increment SKU version
 * =====================
 */
const incrementSkuVersion = (sku: string): string => {
  const versionMatch = sku.match(/-v(\d+)$/);
  if (versionMatch) {
    const currentVersion = parseInt(versionMatch[1], 10);
    return sku.replace(/-v\d+$/, `-v${currentVersion + 1}`);
  }
  return `${sku}-v1`;
};

/**
 * =====================
 * HELPER: Append version to name
 * =====================
 */
const appendNameVersion = (name: string): string => {
  // Match existing version suffix like " (v1)" at the end
  const versionMatch = name.match(/\s*\(v(\d+)\)$/);
  if (versionMatch) {
    const currentVersion = parseInt(versionMatch[1], 10);
    return name.replace(/\s*\(v\d+\)$/, ` (v${currentVersion + 1})`);
  }
  return `${name} (v1)`;
};

/**
 * =====================
 * CREATE
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

    const product = await Product.create({
      name: data.name,
      sku: data.sku ?? null,
      description: data.description ?? null,
      isActive: data.isActive ?? true,
      categoryId: data.categoryId,
      brandId: data.brandId,
      packagingId: data.packagingId,
      bottlesPerBox: data.bottlesPerBox ?? 24,
      boxBuyPrice: data.boxBuyPrice,
      boxSellPrice: data.boxSellPrice,
      singleSellPrice: data.singleSellPrice,
      priceStartDate: data.priceStartDate ?? new Date(),
      priceEndDate: data.priceEndDate ?? null,
    });

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
  } catch (error) {
    console.error("GET PRODUCT BY ID ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =====================
 * UPDATE (with automatic versioning)
 * =====================
 */
export const updateProduct = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    if (!isUUID(id)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const parsed = UpdateProductSchema.safeParse(req.body);

    if (!parsed.success) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Invalid input",
        errors: parsed.error.flatten(),
      });
    }

    const existingProduct = await Product.findByPk(id, { transaction });

    if (!existingProduct) {
      await transaction.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    const data = parsed.data;

    // If priceEndDate is being set and is not null → create a new version
    if (data.priceEndDate !== undefined && data.priceEndDate !== null) {
      // 1. Deactivate the current product
      await existingProduct.update(
        {
          isActive: false,
          priceEndDate: data.priceEndDate,
        },
        { transaction }
      );

      // 2. Create a new version with versioned name and SKU
      const newName = appendNameVersion(data.name ?? existingProduct.name);
      const newSku = data.sku
        ? incrementSkuVersion(data.sku)
        : incrementSkuVersion(existingProduct.sku || "SKU-001");

      const newProductData = {
        name: newName,
        sku: newSku,
        description: data.description ?? existingProduct.description,
        isActive: true,
        categoryId: data.categoryId ?? existingProduct.categoryId,
        brandId: data.brandId ?? existingProduct.brandId,
        packagingId: data.packagingId ?? existingProduct.packagingId,
        bottlesPerBox: data.bottlesPerBox ?? existingProduct.bottlesPerBox,
        boxBuyPrice: data.boxBuyPrice ?? existingProduct.boxBuyPrice,
        boxSellPrice: data.boxSellPrice ?? existingProduct.boxSellPrice,
        singleSellPrice: data.singleSellPrice ?? existingProduct.singleSellPrice,
        priceStartDate: new Date(),
        priceEndDate: null,
      };

      const newProduct = await Product.create(newProductData, { transaction });

      await transaction.commit();
      return res.status(200).json({
        message: "Product updated – new version created",
        original: existingProduct,
        new: newProduct,
      });
    }

    // Normal update without versioning
    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.sku !== undefined) updatePayload.sku = data.sku;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
    if (data.categoryId !== undefined) updatePayload.categoryId = data.categoryId;
    if (data.brandId !== undefined) updatePayload.brandId = data.brandId;
    if (data.packagingId !== undefined) updatePayload.packagingId = data.packagingId;
    if (data.bottlesPerBox !== undefined) updatePayload.bottlesPerBox = data.bottlesPerBox;
    if (data.boxBuyPrice !== undefined) updatePayload.boxBuyPrice = data.boxBuyPrice;
    if (data.boxSellPrice !== undefined) updatePayload.boxSellPrice = data.boxSellPrice;
    if (data.singleSellPrice !== undefined) updatePayload.singleSellPrice = data.singleSellPrice;
    if (data.priceStartDate !== undefined) updatePayload.priceStartDate = data.priceStartDate;
    if (data.priceEndDate !== undefined) updatePayload.priceEndDate = data.priceEndDate;

    await existingProduct.update(updatePayload, { transaction });

    await transaction.commit();
    return res.status(200).json(existingProduct);
  } catch (error) {
    await transaction.rollback();
    console.error("UPDATE PRODUCT ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
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

    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};