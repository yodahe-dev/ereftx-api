import { Op, WhereOptions } from "sequelize";
import db from "../models";
import { Request, Response } from "express";
import { z } from "zod";

const { Brand, Category } = db;

const ALLOWED_LIMITS = [10, 30, 50];
const DEFAULT_LIMIT = 30;

const BrandSchema = z.object({
  name: z.string().trim().min(1, "Brand name is required"),
  categoryId: z.string().uuid("Invalid Category ID format"),
});

type BrandInput = z.infer<typeof BrandSchema>;

interface ParamsWithId {
  id: string;
}

export const createBrand = async (req: Request<{}, {}, BrandInput>, res: Response): Promise<Response> => {
  try {
    const parsed = BrandSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    }

    const { name, categoryId } = parsed.data;
    const normalizedName = name.toLowerCase();
    const categoryExists = await Category.findByPk(categoryId);
    if (!categoryExists) {
      return res.status(404).json({ message: "The specified category does not exist" });
    }
    const existingBrand = await Brand.findOne({ 
      where: { name: normalizedName }, 
      paranoid: false 
    });

    if (existingBrand) {
      if (existingBrand.deletedAt) {
        await existingBrand.restore();
        await existingBrand.update({ categoryId });
        return res.status(200).json({ message: "Brand restored successfully", data: existingBrand });
      }
      return res.status(400).json({ message: "Brand name already exists" });
    }

    const brand = await Brand.create(parsed.data);
    return res.status(201).json(brand);
  } catch (error) {
    console.error("CREATE BRAND ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getBrands = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    let limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;

    if (!ALLOWED_LIMITS.includes(limit)) {
      limit = DEFAULT_LIMIT;
    }

    const search = (req.query.search as string || "").trim().toLowerCase();
    const offset = (page - 1) * limit;

    const whereClause: WhereOptions = {};
    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }

    const { count, rows: brands } = await Brand.findAndCountAll({
      where: whereClause,
      include: [{
        model: Category,
        as: "category",
        attributes: ["id", "name"],
      }],
      attributes: ["id", "name", "createdAt"],
      order: [["name", "ASC"]],
      limit,
      offset,
      raw: true,
      nest: true,
    });

    return res.status(200).json({
      data: brands,
      meta: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit,
        allowedLimits: ALLOWED_LIMITS
      },
    });
  } catch (error) {
    console.error("GET BRANDS ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateBrand = async (
  req: Request<ParamsWithId, {}, Partial<BrandInput>>,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  if (!isUUID(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  const parsed = BrandSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const brand = await Brand.findByPk(id);
  if (!brand) {
    return res.status(404).json({ message: "Brand not found" });
  }

  if (parsed.data.name) {
    const normalizedName = parsed.data.name.toLowerCase();
    const conflict = await Brand.findOne({
      where: { name: normalizedName, id: { [Op.ne]: id } },
    });
    if (conflict) {
      return res.status(400).json({ message: "Brand name already in use" });
    }
    parsed.data.name = normalizedName;
  }

  await brand.update(parsed.data);
  return res.status(200).json(brand);
};

/**
 * DELETE BRAND
 */
export const deleteBrand = async (
  req: Request<ParamsWithId>,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  if (!isUUID(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  const brand = await Brand.findByPk(id);
  if (!brand) {
    return res.status(404).json({ message: "Brand not found" });
  }

  await brand.destroy();
  return res.status(200).json({ message: "Brand deleted successfully" });
};

function isUUID(id: string): boolean {
  return z.string().uuid().safeParse(id).success;
}
