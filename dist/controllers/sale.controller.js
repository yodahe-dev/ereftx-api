"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSale = exports.updateSale = exports.getSaleById = exports.getSales = exports.createSale = void 0;
const saleService = __importStar(require("../service/sales.service"));
const sale_schema_1 = require("../validations/sale.schema");
const zod_1 = require("zod");
const models_1 = __importDefault(require("../models"));
const createSale = async (req, res) => {
    try {
        const validated = sale_schema_1.createSaleSchema.parse(req.body);
        const sale = await saleService.createSale(validated);
        return res.status(201).json({ success: true, data: sale });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ success: false, errors: err.flatten() });
        }
        return res.status(400).json({ success: false, message: err.message });
    }
};
exports.createSale = createSale;
const getSales = async (_, res) => {
    try {
        const sales = await models_1.default.Sale.findAll({
            include: [{ association: "items" }],
            order: [["createdAt", "DESC"]],
        });
        return res.json({ success: true, data: sales });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getSales = getSales;
const getSaleById = async (req, res) => {
    try {
        const saleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!saleId)
            return res.status(400).json({ success: false, message: "Invalid sale id" });
        const sale = await models_1.default.Sale.findByPk(saleId, {
            include: [{ association: "items" }],
        });
        if (!sale)
            return res.status(404).json({ success: false, message: "Sale not found" });
        return res.json({ success: true, data: sale });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getSaleById = getSaleById;
const updateSale = async (req, res) => {
    try {
        const validated = sale_schema_1.updateSaleSchema.parse(req.body);
        const saleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!saleId)
            return res.status(400).json({ success: false, message: "Invalid sale id" });
        const sale = await saleService.updateSale(saleId, validated);
        return res.json({ success: true, data: sale });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ success: false, errors: err.flatten() });
        }
        return res.status(400).json({ success: false, message: err.message });
    }
};
exports.updateSale = updateSale;
const deleteSale = async (req, res) => {
    try {
        const saleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!saleId)
            return res.status(400).json({ success: false, message: "Invalid sale id" });
        const sale = await models_1.default.Sale.findByPk(saleId);
        if (!sale)
            return res.status(404).json({ success: false, message: "Not found" });
        // Note: Deleting a sale does NOT automatically return stock.
        // That's a business decision you may want to add later.
        await sale.destroy();
        return res.json({ success: true, message: "Sale deleted" });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.deleteSale = deleteSale;
