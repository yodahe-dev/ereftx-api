import db from "../models";
import { Request, Response } from "express";

const { Brand } = db;

export const createBrand = async (req: Request, res: Response) => {
  try {
    const brand = await Brand.create(req.body);
    res.status(201).json(brand);
  } catch {
    res.status(500).json({ message: "Error creating brand" });
  }
};

export const getBrands = async (_: Request, res: Response) => {
  const brands = await Brand.findAll();
  res.json(brands);
};

export const updateBrand = async (req: Request, res: Response) => {
  const brand = await Brand.findByPk(req.params.id);
  if (!brand) return res.status(404).json({ message: "Not found" });

  await brand.update(req.body);
  res.json(brand);
};

export const deleteBrand = async (req: Request, res: Response) => {
  const brand = await Brand.findByPk(req.params.id);
  if (!brand) return res.status(404).json({ message: "Not found" });

  await brand.destroy();
  res.json({ message: "Deleted" });
};