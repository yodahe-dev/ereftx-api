import db from "../models";
import { Transaction } from "sequelize";

const { Product, ProductPrice, sequelize, Brand } = db;

/**
 * Creates a product **and always a corresponding active price**.
 * The category is now inferred from the Brand, so categoryId is removed from here.
 */
export const createProductService = async (data: {
  name: string;
  brandId: string;
  packagingId: string;
  unitsPerBox?: number;
  buyPricePerBox?: number;
  sellPricePerBox?: number;
  sellPricePerUnit?: number;
  allowLoss?: boolean;
}) => {
  const transaction: Transaction = await sequelize.transaction();
  try {
    // Security Check: Ensure the brand exists before creating the product
    const brand = await Brand.findByPk(data.brandId, { transaction });
    if (!brand) {
      throw new Error("Cannot create product: The specified Brand does not exist.");
    }

    const product = await Product.create(
      {
        name: data.name,
        brandId: data.brandId,
        packagingId: data.packagingId,
        unitsPerBox: data.unitsPerBox ?? 24,
      },
      { transaction }
    );

    // Create initial price – always present so stock history has a priceId
    await ProductPrice.create(
      {
        productId: product.id,
        buyPricePerBox: data.buyPricePerBox ?? 0,
        sellPricePerBox: data.sellPricePerBox ?? 0,
        sellPricePerUnit: data.sellPricePerUnit ?? 0,
        allowLoss: data.allowLoss ?? false,
        startAt: new Date(),
      },
      { transaction }
    );

    await transaction.commit();
    return product;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Updates a product.
 * Removed categoryId because the product inherits it from the Brand.
 */
export const updateProductService = async (
  productId: string,
  data: {
    name?: string;
    brandId?: string;
    packagingId?: string;
    unitsPerBox?: number;
  }
) => {
  const transaction: Transaction = await sequelize.transaction();
  try {
    const product = await Product.findByPk(productId, { transaction });
    if (!product) throw new Error("Product not found");

    // If changing the brand, verify the new brand exists
    if (data.brandId && data.brandId !== product.brandId) {
      const brandExists = await Brand.findByPk(data.brandId, { transaction });
      if (!brandExists) throw new Error("The new Brand specified does not exist.");
    }

    await product.update(
      {
        name: data.name ?? product.name,
        brandId: data.brandId ?? product.brandId,
        packagingId: data.packagingId ?? product.packagingId,
        unitsPerBox: data.unitsPerBox ?? product.unitsPerBox,
      },
      { transaction }
    );

    await transaction.commit();
    return product;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Adds a new price version and deactivates the old one.
 */
export const addProductPriceService = async (
  productId: string,
  data: {
    buyPricePerBox: number;
    sellPricePerBox: number;
    sellPricePerUnit: number;
    allowLoss?: boolean;
  }
) => {
  const transaction: Transaction = await sequelize.transaction();
  try {
    const product = await Product.findByPk(productId, { transaction });
    if (!product) throw new Error("Product not found");

    // Deactivate current active price (where endAt is null)
    await ProductPrice.update(
      { endAt: new Date() },
      { where: { productId, endAt: null }, transaction }
    );

    const newPrice = await ProductPrice.create(
      {
        productId,
        buyPricePerBox: data.buyPricePerBox,
        sellPricePerBox: data.sellPricePerBox,
        sellPricePerUnit: data.sellPricePerUnit,
        allowLoss: data.allowLoss ?? false,
        startAt: new Date(),
      },
      { transaction }
    );

    await transaction.commit();
    return newPrice;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const deleteProductService = async (productId: string) => {
  const product = await Product.findByPk(productId);
  if (!product) throw new Error("Product not found");
  
  try {
    await product.destroy();
  } catch (error: any) {
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new Error("Cannot delete product: It has existing sales or stock records.");
    }
    throw error;
  }
};