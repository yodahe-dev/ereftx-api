import db from "../models";
import { Request, Response } from "express";
import { z } from "zod";
import { validate as isUUID } from "uuid";

const { Category } = db;

/**
 * =====================
 * SCHEMA
 * =====================
 */
const CategorySchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
});

type CategoryInput = z.infer<typeof CategorySchema>;

interface ParamsWithId {
  id: string;
}

/**
 * =====================
 * CREATE CATEGORY
 * =====================
 */
export const createCategory = async (
  req: Request<{}, {}, CategoryInput>,
  res: Response
): Promise<Response> => {
  try {
    const parsed = CategorySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: parsed.error.flatten(),
      });
    }

    const category = await Category.create(parsed.data);

    return res.status(201).json(category);
  } catch (error: unknown) {
    console.error("CREATE CATEGORY ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * =====================
 * GET ALL
 * =====================
 */
export const getCategories = async (
  _: Request,
  res: Response
): Promise<Response> => {
  try {
    const categories = await Category.findAll();

    return res.status(200).json(categories);
  } catch (error: unknown) {
    console.error("GET CATEGORIES ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * =====================
 * GET BY ID
 * =====================
 */
export const getCategoryById = async (
  req: Request<ParamsWithId>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!isUUID(id)) {
      return res.status(400).json({
        message: "Invalid ID format",
      });
    }

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    return res.status(200).json(category);
  } catch (error: unknown) {
    console.error("GET CATEGORY ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * =====================
 * UPDATE
 * =====================
 */
export const updateCategory = async (
  req: Request<ParamsWithId, {}, Partial<CategoryInput>>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!isUUID(id)) {
      return res.status(400).json({
        message: "Invalid ID format",
      });
    }

    const parsed = CategorySchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: parsed.error.flatten(),
      });
    }

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    await category.update(parsed.data);

    return res.status(200).json(category);
  } catch (error: unknown) {
    console.error("UPDATE CATEGORY ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * =====================
 * DELETE
 * =====================
 */
export const deleteCategory = async (
  req: Request<ParamsWithId>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!isUUID(id)) {
      return res.status(400).json({
        message: "Invalid ID format",
      });
    }

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    await category.destroy();

    return res.status(200).json({
      message: "Deleted successfully",
    });
  } catch (error: unknown) {
    console.error("DELETE CATEGORY ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};