"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchangeSchema = exports.restockSchema = exports.updateStockSchema = exports.createStockSchema = void 0;
const zod_1 = require("zod");
const Stock_1 = require("../models/Stock");
exports.createStockSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    boxQuantity: zod_1.z.number().int().min(0).default(0),
    singleQuantity: zod_1.z.number().int().min(0).default(0),
    containerType: zod_1.z.nativeEnum(Stock_1.ContainerType).default(Stock_1.ContainerType.BOX),
});
exports.updateStockSchema = zod_1.z.object({
    boxQuantity: zod_1.z.number().int().min(0),
    singleQuantity: zod_1.z.number().int().min(0),
    containerType: zod_1.z.nativeEnum(Stock_1.ContainerType).optional(),
});
exports.restockSchema = zod_1.z.object({
    addBoxes: zod_1.z.number().int().min(0).default(0),
    addSingles: zod_1.z.number().int().min(0).default(0),
    notes: zod_1.z.string().optional(),
    isFree: zod_1.z.boolean().default(false),
});
exports.exchangeSchema = zod_1.z.object({
    sourceProductId: zod_1.z.string().uuid({ message: "Invalid Source Product ID" }),
    targetProductId: zod_1.z.string().uuid({ message: "Invalid Target Product ID" }),
    exchangeType: zod_1.z.enum(["box", "single"], {
        message: "Exchange type must be 'box' or 'single'",
    }),
    sourceQuantity: zod_1.z.number().positive("Quantity must be greater than 0"),
    notes: zod_1.z.string().max(255).optional(),
});
