import db from "../models";
import { Request, Response } from "express";

const { Packaging } = db;

export const createPackaging = async (req: Request, res: Response) => {
  try {
    const packaging = await Packaging.create(req.body);
    res.status(201).json(packaging);
  } catch {
    res.status(500).json({ message: "Error creating packaging" });
  }
};

export const getPackagings = async (_: Request, res: Response) => {
  const data = await Packaging.findAll();
  res.json(data);
};

export const updatePackaging = async (req: Request, res: Response) => {
  const item = await Packaging.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });

  await item.update(req.body);
  res.json(item);
};

export const deletePackaging = async (req: Request, res: Response) => {
  const item = await Packaging.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });

  await item.destroy();
  res.json({ message: "Deleted" });
};