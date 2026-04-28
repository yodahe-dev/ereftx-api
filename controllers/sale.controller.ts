import { Request, Response } from "express";
import * as saleService from "../service/sales.service";
import db from "../models";

export const createSale = async (req: Request, res: Response) => {
  try {
    const sale = await saleService.createSale(req.body);
    return res.status(201).json({ success: true, data: sale });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const getSales = async (_: Request, res: Response) => {
  const sales = await db.Sale.findAll({
    include: [{ association: "items" }],
    order: [["createdAt", "DESC"]],
  });
  return res.json({ success: true, data: sales });  // TS knows sales has items? No, but it doesn't break because the response is JSON and the frontend casts.
};

export const getSaleById = async (req: Request, res: Response) => {
  const sale = await db.Sale.findByPk(req.params.id as string, {
    include: [{ association: "items" }],
  });
  if (!sale) return res.status(404).json({ success: false, message: "Sale not found" });
  return res.json({ success: true, data: sale });
};

export const updateSale = async (req: Request, res: Response) => {
  try {
    const sale = await saleService.updateSale(req.params.id as string, req.body);
    return res.json({ success: true, data: sale });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteSale = async (req: Request, res: Response) => {
  const sale = await db.Sale.findByPk(req.params.id as string);
  if (!sale) return res.status(404).json({ success: false, message: "Not found" });
  await sale.destroy();
  return res.json({ success: true, message: "Sale deleted" });
};