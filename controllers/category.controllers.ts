import db from "../models";
import { Request, Response } from "express";

const { Category } = db;

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    const category = await Category.create({ name });

    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: "Error creating category" });
  }
};

export const getCategories = async (_: Request, res: Response) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch {
    res.status(500).json({ message: "Error fetching categories" });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(category);
  } catch {
    res.status(500).json({ message: "Error fetching category" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Not found" });
    }

    await category.update(req.body);

    res.json(category);
  } catch {
    res.status(500).json({ message: "Error updating category" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Not found" });
    }

    await category.destroy();

    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Error deleting category" });
  }
};