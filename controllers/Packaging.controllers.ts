import db from "../models";
import { Request, Response } from "express";
import { z } from "zod";
import { validate as isUUID } from "uuid";

const { Packaging } = db;

/**
 * =====================
 * ENUM (must match model)
 * =====================
 */
export enum PackagingType {
  BOTTLE = "bottle",
  CAN = "can",
  PLASTIC = "plastic",
}

/**
 * =====================
 * SCHEMA
 * =====================
 */
const PackagingSchema = z.object({
  type: z.string().min(1),
});

const UpdatePackagingSchema = PackagingSchema.partial();

/**
 * =====================
 * SAFE ID
 * =====================
 */
const getId = (id: string | string[] | undefined): string | null => {
  if (!id) return null;
  if (Array.isArray(id)) return id[0] ?? null;
  return id;
};

/**
 * =====================
 * NORMALIZE + VALIDATE ENUM
 * =====================
 */
const parsePackagingType = (value: string): PackagingType | null => {
  const normalized = value.trim().toLowerCase();

  if (Object.values(PackagingType).includes(normalized as PackagingType)) {
    return normalized as PackagingType;
  }

  return null;
};

/**
 * =====================
 * CREATE
 * =====================
 */
export const createPackaging = async (req: Request, res: Response) => {
  try {
    const parsed = PackagingSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: parsed.error.flatten(),
      });
    }

    const type = parsePackagingType(parsed.data.type);

    if (!type) {
      return res.status(400).json({
        message: "Invalid packaging type",
        allowed: Object.values(PackagingType),
      });
    }

    const packaging = await Packaging.create({
      type, // ✅ now fully typed
    });

    return res.status(201).json(packaging);
  } catch (error: unknown) {
    console.error("CREATE PACKAGING ERROR:", error);

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
export const getPackagings = async (_: Request, res: Response) => {
  try {
    const data = await Packaging.findAll();
    return res.status(200).json(data);
  } catch (error: unknown) {
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
export const updatePackaging = async (req: Request, res: Response) => {
  try {
    const id = getId(req.params.id);

    if (!id || !isUUID(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const parsed = UpdatePackagingSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: parsed.error.flatten(),
      });
    }

    const item = await Packaging.findByPk(id);

    if (!item) {
      return res.status(404).json({ message: "Not found" });
    }

    let type: PackagingType | undefined;

    if (parsed.data.type) {
      const parsedType = parsePackagingType(parsed.data.type);

      if (!parsedType) {
        return res.status(400).json({
          message: "Invalid packaging type",
          allowed: Object.values(PackagingType),
        });
      }

      type = parsedType;
    }

    await item.update({
      ...(type ? { type } : {}),
    });

    return res.status(200).json(item);
  } catch (error: unknown) {
    console.error("UPDATE PACKAGING ERROR:", error);

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
export const deletePackaging = async (req: Request, res: Response) => {
  try {
    const id = getId(req.params.id);

    if (!id || !isUUID(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const item = await Packaging.findByPk(id);

    if (!item) {
      return res.status(404).json({ message: "Not found" });
    }

    await item.destroy();

    return res.status(200).json({ message: "Deleted" });
  } catch (error: unknown) {
    console.error("DELETE PACKAGING ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};