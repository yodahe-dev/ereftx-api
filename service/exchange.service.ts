import db from "../models";
import { HistoryActionType } from "../models/StockHistory";
import { ContainerType } from "../models/Stock";
import { calculateUnits } from "../utils/inventory.utils";

const { Stock, Product, ProductPrice, Exchange, StockHistory, sequelize } = db;

export interface ExchangeDTO {
  sourceProductId: string;
  targetProductId: string;
  exchangeType: "box" | "single";
  sourceQuantity: number;
  notes?: string;
}

export const processExchangeService = async (data: ExchangeDTO) => {
  const transaction = await sequelize.transaction();

  try {
    const [sourceProduct, targetProduct] = await Promise.all([
      Product.findByPk(data.sourceProductId, { transaction }),
      Product.findByPk(data.targetProductId, { transaction }),
    ]);

    const [sourcePrice, targetPrice] = await Promise.all([
      ProductPrice.findOne({
        where: { productId: data.sourceProductId, endAt: null },
        transaction,
      }),
      ProductPrice.findOne({
        where: { productId: data.targetProductId, endAt: null },
        transaction,
      }),
    ]);

    if (!sourceProduct || !targetProduct)
      throw new Error("Products not found");
    if (!sourcePrice)
      throw new Error(
        `No active price found for source product ${data.sourceProductId}`
      );
    if (!targetPrice)
      throw new Error(
        `No active price found for target product ${data.targetProductId}`
      );

    // Get or create stock rows (like the old code)
    let sourceStock = await Stock.findOne({
      where: { productId: data.sourceProductId },
      transaction,
    });
    let targetStock = await Stock.findOne({
      where: { productId: data.targetProductId },
      transaction,
    });

    if (!sourceStock) {
      sourceStock = await Stock.create(
        {
          productId: data.sourceProductId,
          boxQuantity: 0,
          singleQuantity: 0,
          containerType: ContainerType.BOX,
        },
        { transaction }
      );
    }
    if (!targetStock) {
      targetStock = await Stock.create(
        {
          productId: data.targetProductId,
          boxQuantity: 0,
          singleQuantity: 0,
          containerType: ContainerType.BOX,
        },
        { transaction }
      );
    }

    const deductUnits =
      data.exchangeType === "box"
        ? data.sourceQuantity * sourceProduct.unitsPerBox
        : data.sourceQuantity;

    const sourceTotalUnits = calculateUnits.toTotalUnits(
      sourceStock.boxQuantity,
      sourceStock.singleQuantity,
      sourceProduct.unitsPerBox
    );

    if (sourceTotalUnits < deductUnits) {
      throw new Error("Not enough stock in source product");
    }

    const newSource = calculateUnits.toDisplayUnits(
      sourceTotalUnits - deductUnits,
      sourceProduct.unitsPerBox
    );
    const targetTotalUnits = calculateUnits.toTotalUnits(
      targetStock.boxQuantity,
      targetStock.singleQuantity,
      targetProduct.unitsPerBox
    );
    const newTarget = calculateUnits.toDisplayUnits(
      targetTotalUnits + deductUnits,
      targetProduct.unitsPerBox
    );

    // Calculate financial balance
    const sourceValueExchanged = deductUnits * sourcePrice.sellPricePerUnit;
    const targetValueGained = deductUnits * targetPrice.sellPricePerUnit;
    const balanceAmount = targetValueGained - sourceValueExchanged;

    await sourceStock.update(
      { boxQuantity: newSource.boxes, singleQuantity: newSource.singles },
      { transaction }
    );
    await targetStock.update(
      { boxQuantity: newTarget.boxes, singleQuantity: newTarget.singles },
      { transaction }
    );

    // History for source
    await StockHistory.create(
      {
        productId: sourceProduct.id,
        priceId: sourcePrice.id,
        actionType: HistoryActionType.EXCHANGE,
        boxQuantityBefore: sourceStock.boxQuantity,
        singleQuantityBefore: sourceStock.singleQuantity,
        boxQuantityAfter: newSource.boxes,
        singleQuantityAfter: newSource.singles,
        boxQuantityChange: newSource.boxes - sourceStock.boxQuantity,
        singleQuantityChange: newSource.singles - sourceStock.singleQuantity,
        notes: `Exchanged OUT ${deductUnits} units to ${targetProduct.name}`,
        isFree: false,
      },
      { transaction }
    );

    // History for target
    await StockHistory.create(
      {
        productId: targetProduct.id,
        priceId: targetPrice.id,
        actionType: HistoryActionType.EXCHANGE,
        boxQuantityBefore: targetStock.boxQuantity,
        singleQuantityBefore: targetStock.singleQuantity,
        boxQuantityAfter: newTarget.boxes,
        singleQuantityAfter: newTarget.singles,
        boxQuantityChange: newTarget.boxes - targetStock.boxQuantity,
        singleQuantityChange: newTarget.singles - targetStock.singleQuantity,
        notes: `Exchanged IN ${deductUnits} units from ${sourceProduct.name}`,
        isFree: false,
      },
      { transaction }
    );

    // Exchange ledger entry
    await Exchange.create(
      {
        sourceProductId: sourceProduct.id,
        targetProductId: targetProduct.id,
        sourcePriceId: sourcePrice.id,
        targetPriceId: targetPrice.id,
        exchangeType: data.exchangeType,
        sourceQuantity: data.sourceQuantity,
        targetQuantity: deductUnits,
        balanceAmount: balanceAmount,
        notes: data.notes,
      },
      { transaction }
    );

    await transaction.commit();
    return { success: true, balanceAmount };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};