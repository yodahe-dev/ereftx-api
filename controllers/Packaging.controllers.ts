import db from "../models";
import { Request, Response } from "express";

const { Packaging } = db;

// CREATE
export const createPackaging = async (req: Request, res: Response) => {
  try {
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({ message: "type is required" });
    }

    const packaging = await Packaging.create({ type });

    return res.status(201).json(packaging);
  } catch (err: any) {
    console.error("CREATE PACKAGING ERROR:", err);

    return res.status(500).json({
      message: err?.message || "Error creating packaging",
    });
  }
};

// GET ALL
export const getPackagings = async (_: Request, res: Response) => {
  try {
    const data = await Packaging.findAll();
    return res.json(data);
  } catch (err: any) {
    console.error("GET PACKAGING ERROR:", err);

    return res.status(500).json({
      message: err?.message || "Error fetching packagings",
    });
  }
};

// UPDATE
export const updatePackaging = async (req: Request, res: Response) => {
  try {
    const item = await Packaging.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Not found" });
    }

    await item.update(req.body);

    return res.json(item);
  } catch (err: any) {
    console.error("UPDATE PACKAGING ERROR:", err);

    return res.status(500).json({
      message: err?.message || "Error updating packaging",
    });
  }
};

// DELETE
export const deletePackaging = async (req: Request, res: Response) => {
  try {
    const item = await Packaging.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Not found" });
    }

    await item.destroy();

    return res.json({ message: "Deleted" });
  } catch (err: any) {
    console.error("DELETE PACKAGING ERROR:", err);

    return res.status(500).json({
      message: err?.message || "Error deleting packaging",
    });
  }
};