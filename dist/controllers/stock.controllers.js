"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExchangeHistory = exports.getStockHistory = exports.deleteStock = exports.exchangeProducts = exports.restockProduct = exports.updateStock = exports.getStockById = exports.getStocks = exports.createStock = void 0;
const zod_1 = require("zod");
const uuid_1 = require("uuid");
const models_1 = __importDefault(require("../models"));
const stock_service_1 = require("../service/stock.service");
const exchange_service_1 = require("../service/exchange.service");
const stock_schema_1 = require("../validations/stock.schema");
const { Stock, Product, Exchange, StockHistory } = models_1.default;
function getId(value) {
    if (!value)
        return null;
    if (Array.isArray(value))
        return value[0] ?? null;
    return value;
}
// ---------- Controllers ----------
const createStock = async (req, res) => {
    try {
        const validated = stock_schema_1.createStockSchema.parse(req.body);
        const stock = await (0, stock_service_1.createStockService)(validated);
        return res.status(201).json(stock);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json(error.flatten());
        }
        console.error("CREATE STOCK ERROR:", error);
        return res.status(400).json({ message: error.message || "Internal server error" });
    }
};
exports.createStock = createStock;
const getStocks = async (_, res) => {
    try {
        const stocks = await Stock.findAll({
            include: [{ model: Product, as: "product" }],
            order: [["createdAt", "DESC"]],
        });
        return res.status(200).json(stocks);
    }
    catch (error) {
        console.error("GET STOCKS ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getStocks = getStocks;
const getStockById = async (req, res) => {
    try {
        const id = getId(req.params.id);
        if (!id || !(0, uuid_1.validate)(id)) {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const stock = await Stock.findByPk(id, {
            include: [{ model: Product, as: "product" }],
        });
        if (!stock) {
            return res.status(404).json({ message: "Stock not found" });
        }
        return res.status(200).json(stock);
    }
    catch (error) {
        console.error("GET STOCK BY ID ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getStockById = getStockById;
const updateStock = async (req, res) => {
    try {
        const id = getId(req.params.id);
        if (!id || !(0, uuid_1.validate)(id)) {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const validated = stock_schema_1.updateStockSchema.parse(req.body);
        const updatedStock = await (0, stock_service_1.updateStockService)(id, validated);
        return res.status(200).json(updatedStock);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json(error.flatten());
        }
        console.error("UPDATE STOCK ERROR:", error);
        return res.status(400).json({ message: error.message || "Internal server error" });
    }
};
exports.updateStock = updateStock;
const restockProduct = async (req, res) => {
    try {
        const id = getId(req.params.id);
        if (!id || !(0, uuid_1.validate)(id)) {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const validated = stock_schema_1.restockSchema.parse(req.body);
        const stock = await (0, stock_service_1.restockService)(id, validated);
        return res.status(200).json(stock);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json(error.flatten());
        }
        console.error("RESTOCK ERROR:", error);
        return res.status(400).json({ message: error.message || "Internal server error" });
    }
};
exports.restockProduct = restockProduct;
const exchangeProducts = async (req, res) => {
    try {
        const validatedData = stock_schema_1.exchangeSchema.parse(req.body);
        const result = await (0, exchange_service_1.processExchangeService)(validatedData);
        return res.status(200).json({
            message: "Exchange completed successfully",
            data: result,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json(error.flatten());
        }
        console.error("EXCHANGE ERROR:", error);
        return res.status(400).json({ message: error.message || "Internal server error" });
    }
};
exports.exchangeProducts = exchangeProducts;
const deleteStock = async (req, res) => {
    try {
        const id = getId(req.params.id);
        if (!id || !(0, uuid_1.validate)(id)) {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const stock = await Stock.findByPk(id);
        if (!stock) {
            return res.status(404).json({ message: "Stock not found" });
        }
        await stock.destroy();
        return res.status(200).json({ message: "Deleted successfully" });
    }
    catch (error) {
        console.error("DELETE ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.deleteStock = deleteStock;
const getStockHistory = async (req, res) => {
    try {
        const productId = getId(req.params.productId);
        if (!productId || !(0, uuid_1.validate)(productId)) {
            return res.status(400).json({ message: "Invalid productId" });
        }
        const history = await StockHistory.findAll({
            where: { productId },
            order: [["createdAt", "DESC"]],
        });
        return res.status(200).json(history);
    }
    catch (error) {
        console.error("GET HISTORY ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getStockHistory = getStockHistory;
const getExchangeHistory = async (_, res) => {
    try {
        const exchanges = await Exchange.findAll({
            include: [
                { model: Product, as: "sourceProduct" },
                { model: Product, as: "targetProduct" },
            ],
            order: [["createdAt", "DESC"]],
        });
        return res.status(200).json(exchanges);
    }
    catch (error) {
        console.error("GET EXCHANGE HISTORY ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getExchangeHistory = getExchangeHistory;
