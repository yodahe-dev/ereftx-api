"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.getCategoryById = exports.getCategories = exports.createCategory = void 0;
const models_1 = __importDefault(require("../models"));
const zod_1 = require("zod");
const uuid_1 = require("uuid");
const sequelize_1 = require("sequelize");
const { Category } = models_1.default;
const ALLOWED_LIMITS = [10, 30, 50, 100];
const DEFAULT_LIMIT = 30;
const CategorySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, "Category name is required"),
});
const createCategory = async (req, res) => {
    try {
        const parsed = CategorySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Invalid input",
                errors: parsed.error.flatten(),
            });
        }
        const { name } = parsed.data;
        const normalizedName = name.toLowerCase();
        const existingCategory = await Category.findOne({
            where: { name: normalizedName },
            paranoid: false,
        });
        if (existingCategory) {
            if (existingCategory.deletedAt) {
                await existingCategory.restore();
                return res.status(200).json({
                    message: "Category restored successfully",
                    data: existingCategory,
                });
            }
            return res.status(400).json({
                message: "A category with this name already exists",
            });
        }
        const category = await Category.create(parsed.data);
        return res.status(201).json(category);
    }
    catch (error) {
        console.error("CREATE CATEGORY ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.createCategory = createCategory;
const getCategories = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        let limit = parseInt(req.query.limit) || DEFAULT_LIMIT;
        if (!ALLOWED_LIMITS.includes(limit)) {
            limit = DEFAULT_LIMIT;
        }
        const search = (req.query.search || "").trim().toLowerCase();
        const offset = (page - 1) * limit;
        const whereClause = {};
        if (search) {
            whereClause.name = { [sequelize_1.Op.like]: `%${search}%` };
        }
        const { count, rows: categories } = await Category.findAndCountAll({
            where: whereClause,
            order: [["name", "ASC"]],
            limit,
            offset,
            raw: true,
        });
        return res.status(200).json({
            data: categories,
            meta: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                limit,
                allowedLimits: ALLOWED_LIMITS,
            },
        });
    }
    catch (error) {
        console.error("GET CATEGORIES ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getCategories = getCategories;
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!(0, uuid_1.validate)(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        return res.status(200).json(category);
    }
    catch (error) {
        console.error("GET CATEGORY ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getCategoryById = getCategoryById;
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (!(0, uuid_1.validate)(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }
        const parsed = CategorySchema.partial().safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Invalid input",
                errors: parsed.error.flatten(),
            });
        }
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        if (parsed.data.name) {
            const nameExists = await Category.findOne({
                where: {
                    name: parsed.data.name.toLowerCase(),
                    id: { [sequelize_1.Op.ne]: id }
                }
            });
            if (nameExists) {
                return res.status(400).json({ message: "Category name already in use" });
            }
        }
        await category.update(parsed.data);
        return res.status(200).json(category);
    }
    catch (error) {
        console.error("UPDATE CATEGORY ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (!(0, uuid_1.validate)(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        await category.destroy();
        return res.status(200).json({
            message: "Deleted successfully",
        });
    }
    catch (error) {
        console.error("DELETE CATEGORY ERROR:", error);
        if (error.name === "SequelizeForeignKeyConstraintError") {
            return res.status(400).json({
                message: "Cannot delete category while brands are still linked to it.",
            });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.deleteCategory = deleteCategory;
