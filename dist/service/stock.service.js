"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStockService = exports.restockService = exports.createStockService = void 0;
const models_1 = __importDefault(require("../models"));
const StockHistory_1 = require("../models/StockHistory");
const inventory_utils_1 = require("../utils/inventory.utils");
const { Stock, Product, ProductPrice, StockHistory, sequelize } = models_1.default;
// Helper to get active price
const getActivePrice = async (productId, transaction) => {
    const price = await ProductPrice.findOne({
        where: { productId, endAt: null },
        transaction,
    });
    if (!price) {
        throw new Error(`No active price found for product ${productId}. Create a product price first.`);
    }
    return price;
};
const createStockService = async (data) => {
    const transaction = await sequelize.transaction();
    try {
        const price = await getActivePrice(data.productId, transaction);
        const stock = await Stock.create(data, { transaction });
        await StockHistory.create({
            productId: data.productId,
            priceId: price.id,
            actionType: StockHistory_1.HistoryActionType.INITIAL,
            boxQuantityBefore: 0,
            singleQuantityBefore: 0,
            boxQuantityAfter: stock.boxQuantity,
            singleQuantityAfter: stock.singleQuantity,
            boxQuantityChange: stock.boxQuantity,
            singleQuantityChange: stock.singleQuantity,
            notes: "Initial stock creation",
            isFree: false,
        }, { transaction });
        await transaction.commit();
        return stock;
    }
    catch (error) {
        await transaction.rollback();
        throw error;
    }
};
exports.createStockService = createStockService;
const restockService = async (stockId, data) => {
    const transaction = await sequelize.transaction();
    try {
        const stock = await Stock.findByPk(stockId, { transaction });
        if (!stock)
            throw new Error("Stock not found");
        const product = await Product.findByPk(stock.productId, { transaction });
        if (!product)
            throw new Error("Product not found");
        let price = await getActivePrice(stock.productId, transaction);
        // If a new buy price is provided, create a new price record
        if (data.newBuyPricePerBox && data.newBuyPricePerBox > 0) {
            // End the current active price
            await ProductPrice.update({ endAt: new Date() }, { where: { id: price.id }, transaction });
            // Create a new price (carrying over other pricing fields from the previous price)
            const sellPricePerBox = Number(price.sellPricePerBox);
            const sellPricePerUnit = Number(price.sellPricePerUnit);
            const allowLoss = price.allowLoss;
            price = await ProductPrice.create({
                productId: stock.productId,
                buyPricePerBox: data.newBuyPricePerBox,
                sellPricePerBox: sellPricePerBox,
                sellPricePerUnit: sellPricePerUnit,
                allowLoss: allowLoss,
                startAt: new Date(),
            }, { transaction });
        }
        const unitsPerBox = product.unitsPerBox;
        const addedUnits = inventory_utils_1.calculateUnits.toTotalUnits(data.addBoxes, data.addSingles, unitsPerBox);
        const currentUnits = inventory_utils_1.calculateUnits.toTotalUnits(stock.boxQuantity, stock.singleQuantity, unitsPerBox);
        const final = inventory_utils_1.calculateUnits.toDisplayUnits(currentUnits + addedUnits, unitsPerBox);
        const beforeBox = stock.boxQuantity;
        const beforeSingle = stock.singleQuantity;
        await stock.update({ boxQuantity: final.boxes, singleQuantity: final.singles }, { transaction });
        await StockHistory.create({
            productId: stock.productId,
            priceId: price.id, // points to the (potentially new) active price
            actionType: StockHistory_1.HistoryActionType.RESTOCK,
            boxQuantityBefore: beforeBox,
            singleQuantityBefore: beforeSingle,
            boxQuantityAfter: final.boxes,
            singleQuantityAfter: final.singles,
            boxQuantityChange: final.boxes - beforeBox,
            singleQuantityChange: final.singles - beforeSingle,
            notes: data.notes ||
                `Restocked ${data.addBoxes} boxes, ${data.addSingles} singles`,
            isFree: data.isFree,
        }, { transaction });
        await transaction.commit();
        return stock;
    }
    catch (error) {
        await transaction.rollback();
        throw error;
    }
};
exports.restockService = restockService;
const updateStockService = async (id, data) => {
    const transaction = await sequelize.transaction();
    try {
        const stock = await Stock.findByPk(id, { transaction });
        if (!stock)
            throw new Error("Stock not found");
        const product = await Product.findByPk(stock.productId, { transaction });
        if (!product)
            throw new Error("Product not found");
        const price = await getActivePrice(stock.productId, transaction);
        const unitsPerBox = product.unitsPerBox;
        const totalUnits = inventory_utils_1.calculateUnits.toTotalUnits(data.boxQuantity, data.singleQuantity, unitsPerBox);
        const final = inventory_utils_1.calculateUnits.toDisplayUnits(totalUnits, unitsPerBox);
        const beforeBox = stock.boxQuantity;
        const beforeSingle = stock.singleQuantity;
        await stock.update({
            boxQuantity: final.boxes,
            singleQuantity: final.singles,
            containerType: data.containerType ?? stock.containerType,
        }, { transaction });
        await StockHistory.create({
            productId: stock.productId,
            priceId: price.id,
            actionType: StockHistory_1.HistoryActionType.ADJUST,
            boxQuantityBefore: beforeBox,
            singleQuantityBefore: beforeSingle,
            boxQuantityAfter: final.boxes,
            singleQuantityAfter: final.singles,
            boxQuantityChange: final.boxes - beforeBox,
            singleQuantityChange: final.singles - beforeSingle,
            notes: "Manual adjustment",
            isFree: false,
        }, { transaction });
        await transaction.commit();
        return stock;
    }
    catch (error) {
        await transaction.rollback();
        throw error;
    }
};
exports.updateStockService = updateStockService;
