"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addProductPriceSchema = exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Product name is required").max(120),
    description: zod_1.z.string().max(500).optional().nullable(),
    brandId: zod_1.z.string().uuid("Invalid Brand ID format"),
    packagingId: zod_1.z.string().uuid("Invalid Packaging ID format"),
    unitsPerBox: zod_1.z.number().int().min(1, "Must have at least 1 unit per box").default(24),
    buyPricePerBox: zod_1.z.number().nonnegative("Price cannot be negative").optional(),
    sellPricePerBox: zod_1.z.number().nonnegative("Price cannot be negative").optional(),
    sellPricePerUnit: zod_1.z.number().nonnegative("Price cannot be negative").optional(),
    allowLoss: zod_1.z.boolean().optional().default(false),
});
exports.updateProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Product name is required").max(120).optional(),
    description: zod_1.z.string().max(500).optional().nullable(),
    brandId: zod_1.z.string().uuid("Invalid Brand ID format").optional(),
    packagingId: zod_1.z.string().uuid("Invalid Packaging ID format").optional(),
    unitsPerBox: zod_1.z.number().int().min(1).optional(),
});
exports.addProductPriceSchema = zod_1.z.object({
    buyPricePerBox: zod_1.z.number().nonnegative("Price cannot be negative"),
    sellPricePerBox: zod_1.z.number().nonnegative("Price cannot be negative"),
    sellPricePerUnit: zod_1.z.number().nonnegative("Price cannot be negative"),
    allowLoss: zod_1.z.boolean().optional().default(false),
});
