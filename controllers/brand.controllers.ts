import db from "../models";
import { Request, Response } from "express";
import { z } from "zod";

const { Brand } = db;

/**
 * =====================
 * TYPES
 * =====================
 */

const BrandSchema = z.object({
  name: z.string().min(1),
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
    const brands = await Brand.findAll();
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
  req: Request<ParamsWithId, {}, BrandInput>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

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

    await brand.destroy();

    return res.status(200).json({
      message: "Deleted successfully",
    });
  } catch (error: unknown) {
    console.error("DELETE BRAND ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};