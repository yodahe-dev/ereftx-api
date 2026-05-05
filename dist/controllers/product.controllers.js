"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.addProductPrice = exports.updateProduct = exports.getProductById = exports.getProducts = exports.createProduct = void 0;
const zod_1 = require("zod");
const uuid_1 = require("uuid");
const sequelize_1 = require("sequelize");
const models_1 = __importDefault(require("../models"));
const product_service_1 = require("../service/product.service");
const product_schema_1 = require("../validations/product.schema");
const { Product, ProductPrice, Brand, Category, Packaging } = models_1.default;
/**
 * =====================
 * CREATE PRODUCT
 * =====================
 */
const createProduct = async (req, res) => {
    try {
        const validated = product_schema_1.createProductSchema.parse(req.body);
        const product = await (0, product_service_1.createProductService)(validated);
        return res.status(201).json(product);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json(error.flatten());
        }
        console.error("CREATE PRODUCT ERROR:", error);
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
};
exports.createProduct = createProduct;
/**
 * =====================
 * GET ALL PRODUCTS
 * =====================
 */
const getProducts = async (req, res) => {
    try {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 20);
        const search = String(req.query.search ?? "").trim();
        const offset = (page - 1) * limit;
        const where = {};
        if (search) {
            where.name = { [sequelize_1.Op.like]: `%${search}%` };
        }
        const { rows, count } = await Product.findAndCountAll({
            where,
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            include: [
                // Include the Brand AND its Category
                {
                    model: Brand,
                    as: "brand",
                    include: [
                        {
                            model: Category,
                            as: "category",
                            attributes: ["id", "name"],
                        },
                    ],
                },
                {
                    model: Packaging,
                    as: "packaging",
                    attributes: ["id", "name"],
                },
                {
                    model: ProductPrice,
                    as: "prices",
                    required: false,
                    where: { endAt: null }, // Only get the currently active price
                    limit: 1,
                },
            ],
        });
        return res.status(200).json({
            data: rows,
            page,
            hasMore: offset + rows.length < count,
            total: count,
        });
    }
    catch (error) {
        console.error("GET PRODUCTS ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getProducts = getProducts;
/**
 * =====================
 * GET BY ID
 * =====================
 */
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!(0, uuid_1.validate)(id))
            return res.status(400).json({ message: "Invalid ID" });
        const product = await Product.findByPk(id, {
            include: [
                {
                    model: Brand,
                    as: "brand",
                    include: [{ model: Category, as: "category" }],
                },
                { model: Packaging, as: "packaging" },
                { model: ProductPrice, as: "prices" }, // Return all price history for the detail view
            ],
        });
        if (!product)
            return res.status(404).json({ message: "Not found" });
        return res.status(200).json(product);
    }
    catch (error) {
        console.error("GET PRODUCT ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getProductById = getProductById;
/**
 * =====================
 * UPDATE PRODUCT
 * =====================
 */
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!(0, uuid_1.validate)(id))
            return res.status(400).json({ message: "Invalid ID" });
        const validated = product_schema_1.updateProductSchema.parse(req.body);
        const product = await (0, product_service_1.updateProductService)(id, validated);
        return res.status(200).json(product);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json(error.flatten());
        }
        console.error("UPDATE PRODUCT ERROR:", error);
        return res.status(400).json({ message: error.message || "Internal server error" });
    }
};
exports.updateProduct = updateProduct;
/**
 * =====================
 * ADD PRICE VERSION
 * =====================
 */
const addProductPrice = async (req, res) => {
    try {
        const { id } = req.params;
        if (!(0, uuid_1.validate)(id))
            return res.status(400).json({ message: "Invalid ID" });
        const validated = product_schema_1.addProductPriceSchema.parse(req.body);
        const price = await (0, product_service_1.addProductPriceService)(id, validated);
        return res.status(201).json(price);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json(error.flatten());
        }
        console.error("ADD PRICE ERROR:", error);
        return res.status(400).json({ message: error.message || "Internal server error" });
    }
};
exports.addProductPrice = addProductPrice;
/**
 * =====================
 * DELETE PRODUCT
 * =====================
 */
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!(0, uuid_1.validate)(id))
            return res.status(400).json({ message: "Invalid ID" });
        await (0, product_service_1.deleteProductService)(id);
        return res.status(200).json({ message: "Deleted" });
    }
    catch (error) {
        console.error("DELETE PRODUCT ERROR:", error);
        return res.status(400).json({ message: error.message || "Internal server error" });
    }
};
exports.deleteProduct = deleteProduct;
