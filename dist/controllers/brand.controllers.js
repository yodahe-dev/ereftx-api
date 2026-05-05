"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBrand = exports.updateBrand = exports.getBrands = exports.createBrand = void 0;
const sequelize_1 = require("sequelize");
const models_1 = __importDefault(require("../models"));
const zod_1 = require("zod");
const { Brand, Category } = models_1.default;
const ALLOWED_LIMITS = [10, 30, 50];
const DEFAULT_LIMIT = 30;
const BrandSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, "Brand name is required"),
    categoryId: zod_1.z.string().uuid("Invalid Category ID format"),
});
const createBrand = async (req, res) => {
    try {
        const parsed = BrandSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
        }
        const { name, categoryId } = parsed.data;
        const normalizedName = name.toLowerCase();
        const categoryExists = await Category.findByPk(categoryId);
        if (!categoryExists) {
            return res.status(404).json({ message: "The specified category does not exist" });
        }
        const existingBrand = await Brand.findOne({
            where: { name: normalizedName },
            paranoid: false
        });
        if (existingBrand) {
            if (existingBrand.deletedAt) {
                await existingBrand.restore();
                await existingBrand.update({ categoryId });
                return res.status(200).json({ message: "Brand restored successfully", data: existingBrand });
            }
            return res.status(400).json({ message: "Brand name already exists" });
        }
        const brand = await Brand.create(parsed.data);
        return res.status(201).json(brand);
    }
    catch (error) {
        console.error("CREATE BRAND ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.createBrand = createBrand;
const getBrands = async (req, res) => {
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
        const { count, rows: brands } = await Brand.findAndCountAll({
            where: whereClause,
            include: [{
                    model: Category,
                    as: "category",
                    attributes: ["id", "name"],
                }],
            attributes: ["id", "name", "createdAt"],
            order: [["name", "ASC"]],
            limit,
            offset,
            raw: true,
            nest: true,
        });
        return res.status(200).json({
            data: brands,
            meta: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                limit,
                allowedLimits: ALLOWED_LIMITS
            },
        });
    }
    catch (error) {
        console.error("GET BRANDS ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getBrands = getBrands;
const updateBrand = async (req, res) => {
    const { id } = req.params;
    if (!isUUID(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
    }
    const parsed = BrandSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
    }
    const brand = await Brand.findByPk(id);
    if (!brand) {
        return res.status(404).json({ message: "Brand not found" });
    }
    if (parsed.data.name) {
        const normalizedName = parsed.data.name.toLowerCase();
        const conflict = await Brand.findOne({
            where: { name: normalizedName, id: { [sequelize_1.Op.ne]: id } },
        });
        if (conflict) {
            return res.status(400).json({ message: "Brand name already in use" });
        }
        parsed.data.name = normalizedName;
    }
    await brand.update(parsed.data);
    return res.status(200).json(brand);
};
exports.updateBrand = updateBrand;
/**
 * DELETE BRAND
 */
const deleteBrand = async (req, res) => {
    const { id } = req.params;
    if (!isUUID(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
    }
    const brand = await Brand.findByPk(id);
    if (!brand) {
        return res.status(404).json({ message: "Brand not found" });
    }
    await brand.destroy();
    return res.status(200).json({ message: "Brand deleted successfully" });
};
exports.deleteBrand = deleteBrand;
function isUUID(id) {
    return zod_1.z.string().uuid().safeParse(id).success;
}
