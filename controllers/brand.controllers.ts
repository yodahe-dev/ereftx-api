import db from "../models";
import { Request, Response } from "express";
import { z } from "zod";

const { Brand, Category } = db;

/**
 * =====================
 * TYPES & VALIDATION
 * =====================
 */

// Added categoryId to the validation schema
const BrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  categoryId: z.string().uuid("Invalid Category ID format"),
});

type BrandInput = z.infer<typeof BrandSchema>;

interface ParamsWithId {
  id: string;
}

/**
 * =====================
 * CREATE BRAND
 * =====================
 */
export const createBrand = async (
  req: Request<{}, {}, BrandInput>,
  res: Response
): Promise<Response> => {
  try {
    const parsed = BrandSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: parsed.error.flatten(),
      });
    }

    // Check if the category actually exists before creating the brand
    // This prevents foreign key constraint crashes
    const categoryExists = await Category.findByPk(parsed.data.categoryId);
    if (!categoryExists) {
      return res.status(404).json({
        message: "The specified category does not exist",
      });
    }

    const brand = await Brand.create(parsed.data);

    return res.status(201).json(brand);
  } catch (error: unknown) {
    console.error("CREATE BRAND ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * =====================
 * GET ALL BRANDS
 * =====================
 */
export const getBrands = async (
  _: Request,
  res: Response
): Promise<Response> => {
  try {
    // Included the Category model so the frontend gets the category name automatically
    const brands = await Brand.findAll({
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
        },
      ],
      order: [["name", "ASC"]],
    });
    return res.status(200).json(brands);
  } catch (error: unknown) {
    console.error("GET BRANDS ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * =====================
 * UPDATE BRAND
 * =====================
 */
export const updateBrand = async (
  req: Request<ParamsWithId, {}, Partial<BrandInput>>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    // Use partial validation for updates
    const parsed = BrandSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: parsed.error.flatten(),
      });
    }

    const brand = await Brand.findByPk(id);

    if (!brand) {
      return res.status(404).json({
        message: "Brand not found",
      });
    }

    // If categoryId is being updated, verify the new category exists
    if (parsed.data.categoryId) {
      const categoryExists = await Category.findByPk(parsed.data.categoryId);
      if (!categoryExists) {
        return res.status(404).json({
          message: "The new category specified does not exist",
        });
      }
    }

    await brand.update(parsed.data);

    return res.status(200).json(brand);
  } catch (error: unknown) {
    console.error("UPDATE BRAND ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * =====================
 * DELETE BRAND
 * =====================
 */
export const deleteBrand = async (
  req: Request<ParamsWithId>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    const brand = await Brand.findByPk(id);

    if (!brand) {
      return res.status(404).json({
        message: "Brand not found",
      });
    }

    /**
     * Security Note: 
     * Because we set onDelete: "RESTRICT" in the associations, 
     * Sequelize will throw an error if you try to delete a brand 
     * that is still linked to products.
     */
    await brand.destroy();

    return res.status(200).json({
      message: "Deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE BRAND ERROR:", error);

    // Specific handling for foreign key restrictions
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        message: "Cannot delete brand because it is currently linked to products.",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};