import db from "../models";
import { Transaction } from "sequelize";

const { Product, ProductPrice, sequelize } = db;

/**
 * Creates a product **and always a corresponding active price**.
 * If no price data is provided, a zero‑price entry is inserted so stock operations
 * won’t break.
 */
export const createProductService = async (data: {
  name: string;
  categoryId: string;
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

export const updateProductService = async (
  productId: string,
  data: {
    name?: string;
    categoryId?: string;
    brandId?: string;
    packagingId?: string;
    unitsPerBox?: number;
  }
) => {
  const transaction: Transaction = await sequelize.transaction();
  try {
    const product = await Product.findByPk(productId, { transaction });
    if (!product) throw new Error("Product not found");

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
    return product;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

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

    // Deactivate current active price
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
  // no transaction needed for a simple delete (cascade will handle prices)
  const product = await Product.findByPk(productId);
  if (!product) throw new Error("Product not found");
  await product.destroy();
};