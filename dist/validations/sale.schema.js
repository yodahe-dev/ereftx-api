"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSaleSchema = exports.createSaleSchema = exports.createSaleItemSchema = void 0;
const zod_1 = require("zod");
exports.createSaleItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid("Invalid product ID"),
    quantity: zod_1.z.number().int().positive("Quantity must be at least 1"),
    unitType: zod_1.z.enum(["box", "single"], { message: "Must be 'box' or 'single'" }),
    customUnitPrice: zod_1.z.number().nonnegative().optional(),
});
exports.createSaleSchema = zod_1.z.object({
    customerName: zod_1.z.string().min(1, "Customer name is required").max(120),
    description: zod_1.z.string().max(500).nullable().optional(),
    paymentType: zod_1.z.enum(["cash", "credit"], { message: "Must be 'cash' or 'credit'" }),
    paymentStatus: zod_1.z.enum(["paid", "pending"]).optional().default("paid"),
    items: zod_1.z.array(exports.createSaleItemSchema).min(1, "At least one item is required"),
});
exports.updateSaleSchema = zod_1.z.object({
    customerName: zod_1.z.string().min(1).max(120).optional(),
    description: zod_1.z.string().max(500).nullable().optional(),
    paymentType: zod_1.z.enum(["cash", "credit"]).optional(),
    paymentStatus: zod_1.z.enum(["paid", "pending"]).optional(),
    items: zod_1.z.array(exports.createSaleItemSchema).min(1).optional(),
});
