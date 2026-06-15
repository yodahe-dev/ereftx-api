import db from "../models";
import { Op } from "sequelize";

const { ProductPrice, StockHistory, sequelize } = db;

export const createPriceService = async (data: {
  productId: string;
  buyPricePerBox: number;
  sellPricePerBox: number;
  sellPricePerUnit: number;
  allowLoss: boolean;
  startAt?: string;
}) => {
  const transaction = await sequelize.transaction();
  try {
    const startAt = data.startAt ? new Date(data.startAt) : new Date();

    // Deactivate any currently active price for this product
    await ProductPrice.update(
      { endAt: startAt },
      {
        where: { productId: data.productId, endAt: null },
        transaction,
      }
    );

    // Create new active price
    const newPrice = await ProductPrice.create(
      {
        productId: data.productId,
        buyPricePerBox: data.buyPricePerBox,
        sellPricePerBox: data.sellPricePerBox,
        sellPricePerUnit: data.sellPricePerUnit,
        allowLoss: data.allowLoss,
        startAt,
        endAt: null,
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

export const getPricesByProductService = async (productId: string) => {
  const prices = await ProductPrice.findAll({
    where: { productId },
    order: [["startAt", "DESC"]],
  });
  return prices;
};

export const updatePriceService = async (priceId: string, data: any) => {
  const transaction = await sequelize.transaction();
  try {
    const price = await ProductPrice.findByPk(priceId, { transaction });
    if (!price) throw new Error("Price not found");

    // Check if price has been used in any stock movement
    const usedInHistory = await StockHistory.findOne({
      where: { priceId },
      transaction,
    });
    if (usedInHistory && (data.buyPricePerBox !== undefined || data.sellPricePerBox !== undefined || data.sellPricePerUnit !== undefined)) {
      throw new Error("Cannot change core price values because it has been used in stock movements");
    }

    // If we are setting endAt = null (activating), deactivate current active price for this product
    if (data.endAt === null) {
      const existingActive = await ProductPrice.findOne({
        where: { productId: price.productId, endAt: null, id: { [Op.ne]: priceId } },
        transaction,
      });
      if (existingActive) {
        await existingActive.update({ endAt: new Date() }, { transaction });
      }
    }

    await price.update(data, { transaction });
    await transaction.commit();
    return price;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const deletePriceService = async (priceId: string) => {
  const transaction = await sequelize.transaction();
  try {
    const price = await ProductPrice.findByPk(priceId, { transaction });
    if (!price) throw new Error("Price not found");

    const usedInHistory = await StockHistory.findOne({
      where: { priceId },
      transaction,
    });
    if (usedInHistory) {
      throw new Error("Cannot delete price because it has been used in stock movements");
    }

    await price.destroy({ transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const activatePriceService = async (priceId: string, productId: string) => {
  const transaction = await sequelize.transaction();
  try {
    const price = await ProductPrice.findByPk(priceId, { transaction });
    if (!price) throw new Error("Price not found");
    if (price.productId !== productId) {
      throw new Error("Price does not belong to the specified product");
    }

    // Deactivate current active price for this product
    const currentActive = await ProductPrice.findOne({
      where: { productId, endAt: null },
      transaction,
    });
    if (currentActive && currentActive.id !== priceId) {
      await currentActive.update({ endAt: new Date() }, { transaction });
    }

    // Activate the selected price
    await price.update({ endAt: null, startAt: new Date() }, { transaction });

    await transaction.commit();
    return price;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};