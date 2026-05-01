import db from "../models";
import { Transaction } from "sequelize";

const { Product, ProductPrice, sequelize, Brand, Packaging } = db;

export const createProductService = async (data: {
  name: string;
  description?: string | null;
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
    // Verify brand exists
    const brand = await Brand.findByPk(data.brandId, { transaction });
    if (!brand) {
      throw new Error("Cannot create product: The specified Brand does not exist.");
    }

    // Verify packaging exists
    const packaging = await Packaging.findByPk(data.packagingId, { transaction });
    if (!packaging) {
      throw new Error("Cannot create product: The specified Packaging does not exist.");
    }

    const product = await Product.create(
      {
        name: data.name,
        description: data.description ?? null,
        brandId: data.brandId,
        packagingId: data.packagingId,
        unitsPerBox: data.unitsPerBox ?? 24,
      },
      { transaction }
    );

    // Create initial price
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
    description?: string | null;
    brandId?: string;
    packagingId?: string;
    unitsPerBox?: number;
  }
) => {
  const transaction: Transaction = await sequelize.transaction();
  try {
    const product = await Product.findByPk(productId, { transaction });
    if (!product) throw new Error("Product not found");

    // If changing brand, verify new brand exists
    if (data.brandId && data.brandId !== product.brandId) {
      const brandExists = await Brand.findByPk(data.brandId, { transaction });
      if (!brandExists) throw new Error("The new Brand specified does not exist.");
    }

    // If changing packaging, verify new packaging exists
    if (data.packagingId && data.packagingId !== product.packagingId) {
      const packagingExists = await Packaging.findByPk(data.packagingId, { transaction });
      if (!packagingExists) throw new Error("The new Packaging specified does not exist.");
    }

    await product.update(
      {
        name: data.name ?? product.name,
        description: data.description !== undefined ? data.description : product.description,
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
  const transaction: Transaction = await sequelize.transaction();
  try {
    const product = await Product.findByPk(productId, { transaction });
    if (!product) throw new Error("Product not found");
    await product.destroy({ transaction });
    await transaction.commit();
  } catch (error: any) {
    await transaction.rollback();
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new Error("Cannot delete product: It has existing sales or stock records.");
    }
    throw error;
  }
};