import { Request, Response } from "express";
import * as saleService from "../service/sales.service";
import { createSaleSchema, updateSaleSchema } from "../validations/sale.schema";
import { z } from "zod";
import db from "../models";

export const createSale = async (req: Request, res: Response) => {
  try {
    const validated = createSaleSchema.parse(req.body);
    const sale = await saleService.createSale(validated);
    return res.status(201).json({ success: true, data: sale });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.flatten() });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const getSales = async (_: Request, res: Response) => {
  try {
    const sales = await db.Sale.findAll({
      include: [{ association: "items" }],
      order: [["createdAt", "DESC"]],
    });
    return res.json({ success: true, data: sales });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getSaleById = async (req: Request, res: Response) => {
  try {
    const saleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!saleId) return res.status(400).json({ success: false, message: "Invalid sale id" });
    const sale = await db.Sale.findByPk(saleId, {
      include: [{ association: "items" }],
    });
    if (!sale)
      return res.status(404).json({ success: false, message: "Sale not found" });
    return res.json({ success: true, data: sale });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateSale = async (req: Request, res: Response) => {
  try {
    const validated = updateSaleSchema.parse(req.body);
    const saleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!saleId) return res.status(400).json({ success: false, message: "Invalid sale id" });
    const sale = await saleService.updateSale(saleId, validated);
    return res.json({ success: true, data: sale });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.flatten() });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteSale = async (req: Request, res: Response) => {
  try {
    const saleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!saleId) return res.status(400).json({ success: false, message: "Invalid sale id" });
    const sale = await db.Sale.findByPk(saleId);
    if (!sale)
      return res.status(404).json({ success: false, message: "Not found" });
    // Note: Deleting a sale does NOT automatically return stock.
    // That's a business decision you may want to add later.
    await sale.destroy();
    return res.json({ success: true, message: "Sale deleted" });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};