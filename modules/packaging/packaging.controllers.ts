import { Request, Response } from "express";
import { z } from "zod";
import { validate as isUUID } from "uuid";
import { Op, WhereOptions } from "sequelize";
import db from "../../models";

const { Packaging } = db;

// --- CONSTANTS (Missing in your previous version) ---
const ALLOWED_LIMITS = [10, 30, 50] as const;
const DEFAULT_LIMIT = 30;

export const PackagingSchema = z.object({
  name: z.string().trim().min(1, "Packaging name is required").max(50),
});

export type PackagingInput = z.infer<typeof PackagingSchema>;

export interface ParamsWithId {
  id: string;
}

/**
 * CREATE PACKAGING
 */
export const createPackaging = async (
  req: Request<{}, {}, PackagingInput>,
  res: Response
): Promise<Response> => {
  const parsed = PackagingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const { name } = parsed.data;
  const normalizedName = name.toLowerCase();

  const existing = await Packaging.findOne({ 
    where: { name: normalizedName }, 
    paranoid: false 
  });

  if (existing) {
    if (existing.deletedAt) {
      await existing.restore();
      return res.status(200).json({
        message: "Packaging restored successfully",
        data: existing,
      });
    }
    return res.status(400).json({ message: "Packaging type already exists" });
  }

  const item = await Packaging.create({ name: normalizedName });
  return res.status(201).json(item);
};

/**
 * GET PACKAGINGS (Search & Pagination)
 */
export const getPackagings = async (req: Request, res: Response): Promise<Response> => {
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
};

/**
 * UPDATE PACKAGING
 */
export const updatePackaging = async (
  req: Request<ParamsWithId, {}, Partial<PackagingInput>>,
  res: Response
): Promise<Response> => {
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

  // Handle name change and normalization
  if (parsed.data.name) {
    const normalizedName = parsed.data.name.toLowerCase();
    const conflict = await Packaging.findOne({
      where: { name: normalizedName, id: { [Op.ne]: id } },
    });
    if (conflict) {
      return res.status(400).json({ message: "Name already in use" });
    }
    parsed.data.name = normalizedName;
  }

  await item.update(parsed.data);
  return res.status(200).json(item);
};

