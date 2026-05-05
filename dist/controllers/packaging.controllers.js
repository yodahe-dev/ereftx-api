"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePackaging = exports.getPackagings = exports.createPackaging = exports.PackagingSchema = void 0;
const zod_1 = require("zod");
const uuid_1 = require("uuid");
const sequelize_1 = require("sequelize");
const models_1 = __importDefault(require("../models"));
const { Packaging } = models_1.default;
// --- CONSTANTS (Missing in your previous version) ---
const ALLOWED_LIMITS = [10, 30, 50];
const DEFAULT_LIMIT = 30;
exports.PackagingSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, "Packaging name is required").max(50),
});
/**
 * CREATE PACKAGING
 */
const createPackaging = async (req, res) => {
    const parsed = exports.PackagingSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
    }
    const { name } = parsed.data;
    const normalizedName = name.toLowerCase();
    const existing = await Packaging.findOne({
        where: { name: normalizedName },
        paranoid: false
    });
    if (existing) {
        if (existing.deletedAt) {
            await existing.restore();
            return res.status(200).json({
                message: "Packaging restored successfully",
                data: existing,
            });
        }
        return res.status(400).json({ message: "Packaging type already exists" });
    }
    const item = await Packaging.create({ name: normalizedName });
    return res.status(201).json(item);
};
exports.createPackaging = createPackaging;
/**
 * GET PACKAGINGS (Search & Pagination)
 */
const getPackagings = async (req, res) => {
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
    const { count, rows } = await Packaging.findAndCountAll({
        where: whereClause,
        order: [["name", "ASC"]],
        limit,
        offset,
        raw: true,
    });
    return res.status(200).json({
        data: rows,
        meta: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit,
        },
    });
};
exports.getPackagings = getPackagings;
/**
 * UPDATE PACKAGING
 */
const updatePackaging = async (req, res) => {
    const { id } = req.params;
    if (!(0, uuid_1.validate)(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
    }
    const parsed = exports.PackagingSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
    }
    const item = await Packaging.findByPk(id);
    if (!item) {
        return res.status(404).json({ message: "Packaging not found" });
    }
    // Handle name change and normalization
    if (parsed.data.name) {
        const normalizedName = parsed.data.name.toLowerCase();
        const conflict = await Packaging.findOne({
            where: { name: normalizedName, id: { [sequelize_1.Op.ne]: id } },
        });
        if (conflict) {
            return res.status(400).json({ message: "Name already in use" });
        }
        parsed.data.name = normalizedName;
    }
    await item.update(parsed.data);
    return res.status(200).json(item);
};
exports.updatePackaging = updatePackaging;
