import db from "../models";
import { Request, Response } from "express";

const { Category } = db;

// =====================
// CREATE CATEGORY
// =====================
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const category = await Category.create({ name });

    return res.status(201).json(category);
  } catch (err: any) {
    console.error("CREATE CATEGORY ERROR:", err);

    return res.status(500).json({
      message: err?.message || "Error creating category",
    });
  }
};

// =====================
// GET ALL CATEGORIES
// =====================
export const getCategories = async (_: Request, res: Response) => {
  try {
    const categories = await Category.findAll();
    return res.json(categories);
  } catch (err: any) {
    console.error("GET CATEGORIES ERROR:", err);

    return res.status(500).json({
      message: err?.message || "Error fetching categories",
    });
  }
};

// =====================
// GET BY ID
// =====================
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.json(category);
  } catch (err: any) {
    console.error("GET CATEGORY BY ID ERROR:", err);

    return res.status(500).json({
      message: err?.message || "Error fetching category",
    });
  }
};

// =====================
// UPDATE CATEGORY
// =====================
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Not found" });
    }

    await category.update(req.body);

    return res.json(category);
  } catch (err: any) {
    console.error("UPDATE CATEGORY ERROR:", err);

    return res.status(500).json({
      message: err?.message || "Error updating category",
    });
  }
};

// =====================
// DELETE CATEGORY
// =====================
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Not found" });
    }

    await category.destroy();

    return res.json({ message: "Deleted" });
  } catch (err: any) {
    console.error("DELETE CATEGORY ERROR:", err);

    return res.status(500).json({
      message: err?.message || "Error deleting category",
    });
  }
};