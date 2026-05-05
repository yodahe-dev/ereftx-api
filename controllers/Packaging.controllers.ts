import { Request, Response } from "express";
import { z } from "zod";
import { validate as isUUID } from "uuid";
import { Op, WhereOptions } from "sequelize";
import db from "../models";

const { Packaging } = db;

const ALLOWED_LIMITS = [10, 30, 50] as const;
const DEFAULT_LIMIT = 30;

const PackagingSchema = z.object({
  name: z.string().trim().min(1, "Packaging name is required").max(50),
});

type PackagingInput = z.infer<typeof PackagingSchema>;

interface ParamsWithId {
  id: string;
}


export const createPackaging = async (
  req: Request<{}, {}, PackagingInput>, 
  res: Response
): Promise<Response> => {
  try {
    const parsed = PackagingSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: parsed.error.flatten(),
      });
    }

    const { name } = parsed.data;
    const normalizedName = name.toLowerCase();

    // Check for existing/soft-deleted records
    const existing = await Packaging.findOne({
      where: { name: normalizedName },
      paranoid: false,
    });

    if (existing) {
      if (existing.deletedAt) {
        await existing.restore();
        return res.status(200).json({
          message: "Packaging type restored",
          data: existing,
        });
      }
      return res.status(400).json({ message: "This packaging type already exists" });
    }

    const packaging = await Packaging.create({ name: normalizedName });
    return res.status(201).json(packaging);
  } catch (error) {
    console.error("CREATE PACKAGING ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET ALL (With Pagination & Search)
 */
export const getPackagings = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    let limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;
    
    if (!ALLOWED_LIMITS.includes(limit as any)) {
      limit = DEFAULT_LIMIT;
    }

    const search = (req.query.search as string || "").trim().toLowerCase();
    const offset = (page - 1) * limit;

    const whereClause: WhereOptions = {};
    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await Packaging.findAndCountAll({
      where: whereClause,
      order: [["name", "ASC"]],
      limit,
      offset,
      raw: true,
    });

    return res.status(200).json({
      data: rows,
      meta: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("GET PACKAGINGS ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * UPDATE PACKAGING
 */
export const updatePackaging = async (
  req: Request<ParamsWithId, {}, Partial<PackagingInput>>, 
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!isUUID(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const parsed = PackagingSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const item = await Packaging.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: "Packaging not found" });
    }

    // Uniqueness check for name update
    if (parsed.data.name) {
      const normalizedName = parsed.data.name.toLowerCase();
      const nameConflict = await Packaging.findOne({
        where: { name: normalizedName, id: { [Op.ne]: id } }
      });
      if (nameConflict) {
        return res.status(400).json({ message: "Name already in use" });
      }
      parsed.data.name = normalizedName;
    }

    await item.update(parsed.data);
    return res.status(200).json(item);
  } catch (error) {
    console.error("UPDATE PACKAGING ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * DELETE PACKAGING
 */
export const deletePackaging = async (
  req: Request<ParamsWithId>, 
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!isUUID(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const item = await Packaging.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: "Not found" });
    }

    await item.destroy();
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error: any) {
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        message: "Cannot delete: Packaging is linked to active products."
      });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};