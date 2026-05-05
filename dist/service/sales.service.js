"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSale = exports.createSale = void 0;
const models_1 = __importDefault(require("../models"));
const StockHistory_1 = require("../models/StockHistory");
async function processSaleItem(saleId, item, t, isAdding) {
    // Fetch required entities
    const product = await models_1.default.Product.findByPk(item.productId, { transaction: t });
    if (!product)
        throw new Error(`Product not found: ${item.productId}`);
    const price = await models_1.default.ProductPrice.findOne({
        where: { productId: item.productId, endAt: null },
        transaction: t,
    });
    if (!price)
        throw new Error(`No active price for product ${item.productId}`);
    const stock = await models_1.default.Stock.findOne({
        where: { productId: item.productId },
        transaction: t,
        lock: t.LOCK.UPDATE,
    });
    if (!stock)
        throw new Error(`Stock not found for product ${item.productId}`);
    const beforeBox = stock.boxQuantity;
    const beforeSingle = stock.singleQuantity;
    if (isAdding) {
        // Deduct stock
        if (item.unitType === "box") {
            if (stock.boxQuantity < item.quantity)
                throw new Error(`Not enough boxes of ${product.name} (have ${stock.boxQuantity})`);
            stock.boxQuantity -= item.quantity;
        }
        else {
            // Single deduction with automatic box‑breaking
            if (stock.singleQuantity < item.quantity) {
                const shortage = item.quantity - stock.singleQuantity;
                const boxesToBreak = Math.ceil(shortage / product.unitsPerBox);
                if (stock.boxQuantity < boxesToBreak)
                    throw new Error(`Not enough singles of ${product.name}. Need ${item.quantity}, have ${stock.singleQuantity} singles and ${stock.boxQuantity} boxes.`);
                // Break boxes into singles
                stock.boxQuantity -= boxesToBreak;
                stock.singleQuantity += boxesToBreak * product.unitsPerBox;
            }
            stock.singleQuantity -= item.quantity;
        }
        await stock.save({ transaction: t });
        // Record stock history WITH priceId
        await models_1.default.StockHistory.create({
            productId: product.id,
            priceId: price.id, // <--- THIS IS THE CRITICAL FIX
            actionType: StockHistory_1.HistoryActionType.SALE,
            boxQuantityBefore: beforeBox,
            singleQuantityBefore: beforeSingle,
            boxQuantityAfter: stock.boxQuantity,
            singleQuantityAfter: stock.singleQuantity,
            boxQuantityChange: stock.boxQuantity - beforeBox,
            singleQuantityChange: stock.singleQuantity - beforeSingle,
            saleId,
            isFree: false,
        }, { transaction: t });
    }
    else {
        // Return stock (when removing an item)
        if (item.unitType === "box") {
            stock.boxQuantity += item.quantity;
        }
        else {
            stock.singleQuantity += item.quantity;
        }
        await stock.save({ transaction: t });
        await models_1.default.StockHistory.create({
            productId: product.id,
            priceId: price.id,
            actionType: StockHistory_1.HistoryActionType.ADJUST,
            boxQuantityBefore: beforeBox,
            singleQuantityBefore: beforeSingle,
            boxQuantityAfter: stock.boxQuantity,
            singleQuantityAfter: stock.singleQuantity,
            boxQuantityChange: stock.boxQuantity - beforeBox,
            singleQuantityChange: stock.singleQuantity - beforeSingle,
            saleId,
            isFree: false,
        }, { transaction: t });
    }
    // Pricing
    const unitPrice = item.customUnitPrice != null
        ? item.customUnitPrice
        : item.unitType === "box"
            ? price.sellPricePerBox
            : price.sellPricePerUnit;
    const costPerUnit = price.buyPricePerBox / product.unitsPerBox;
    const costPrice = item.unitType === "box" ? price.buyPricePerBox : costPerUnit;
    const totalPrice = unitPrice * item.quantity;
    const totalItemCost = costPrice * item.quantity;
    const totalUnits = item.unitType === "box" ? item.quantity * product.unitsPerBox : item.quantity;
    return {
        unitPrice,
        costPrice,
        totalPrice,
        totalItemCost,
        productName: product.name,
        totalUnits,
        priceId: price.id,
    };
}
/**
 * CREATE SALE
 */
const createSale = async (input) => {
    const t = await models_1.default.sequelize.transaction();
    try {
        const sale = await models_1.default.Sale.create({
            customerName: input.customerName,
            description: input.description,
            paymentType: input.paymentType,
            paymentStatus: input.paymentStatus,
        }, { transaction: t });
        let totalAmount = 0;
        let totalCost = 0;
        for (const item of input.items) {
            const processed = await processSaleItem(sale.id, item, t, true);
            await models_1.default.SaleItem.create({
                saleId: sale.id,
                productId: item.productId,
                priceId: processed.priceId,
                unitType: item.unitType,
                quantity: item.quantity,
                totalUnits: processed.totalUnits,
                productName: processed.productName,
                unitPrice: processed.unitPrice,
                costPrice: processed.costPrice,
                totalPrice: processed.totalPrice,
                totalCost: processed.totalItemCost,
            }, { transaction: t });
            totalAmount += processed.totalPrice;
            totalCost += processed.totalItemCost;
        }
        sale.totalAmount = totalAmount;
        sale.totalCost = totalCost;
        sale.profit = totalAmount - totalCost;
        await sale.save({ transaction: t });
        await t.commit();
        // Reload with items for the response
        const fullSale = await models_1.default.Sale.findByPk(sale.id, {
            include: [{ association: "items" }],
        });
        return fullSale;
    }
    catch (err) {
        await t.rollback();
        throw err;
    }
};
exports.createSale = createSale;
/**
 * UPDATE SALE
 */
const updateSale = async (saleId, input) => {
    const t = await models_1.default.sequelize.transaction();
    try {
        const sale = await models_1.default.Sale.findByPk(saleId, {
            include: [{ association: "items" }],
            transaction: t,
        });
        if (!sale)
            throw new Error("Sale not found");
        // Update metadata
        if (input.customerName !== undefined)
            sale.customerName = input.customerName;
        if (input.description !== undefined)
            sale.description = input.description;
        if (input.paymentType)
            sale.paymentType = input.paymentType;
        if (input.paymentStatus)
            sale.paymentStatus = input.paymentStatus;
        await sale.save({ transaction: t });
        // If items are provided, replace them entirely
        if (input.items && input.items.length > 0) {
            // Reverse old items (return stock)
            const oldItems = sale.items ?? [];
            for (const oldItem of oldItems) {
                // Use processSaleItem with isAdding=false to return stock
                await processSaleItem(sale.id, {
                    productId: oldItem.productId,
                    quantity: oldItem.quantity,
                    unitType: oldItem.unitType,
                }, t, false);
                await oldItem.destroy({ transaction: t });
            }
            // Process new items
            let totalAmount = 0;
            let totalCost = 0;
            for (const item of input.items) {
                const processed = await processSaleItem(sale.id, item, t, true);
                await models_1.default.SaleItem.create({
                    saleId: sale.id,
                    productId: item.productId,
                    priceId: processed.priceId,
                    unitType: item.unitType,
                    quantity: item.quantity,
                    totalUnits: processed.totalUnits,
                    productName: processed.productName,
                    unitPrice: processed.unitPrice,
                    costPrice: processed.costPrice,
                    totalPrice: processed.totalPrice,
                    totalCost: processed.totalItemCost,
                }, { transaction: t });
                totalAmount += processed.totalPrice;
                totalCost += processed.totalItemCost;
            }
            sale.totalAmount = totalAmount;
            sale.totalCost = totalCost;
            sale.profit = totalAmount - totalCost;
            await sale.save({ transaction: t });
        }
        await t.commit();
        // Reload with items
        const updatedSale = await models_1.default.Sale.findByPk(saleId, {
            include: [{ association: "items" }],
        });
        return updatedSale;
    }
    catch (err) {
        await t.rollback();
        throw err;
    }
};
exports.updateSale = updateSale;
