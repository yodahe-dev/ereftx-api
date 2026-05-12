import { Op, Transaction } from "sequelize";
import db from "../../../models";
import { CreateBoxSchema, UpdateBoxSchema, BulkUpdateInventorySchema, BoxQuerySchema } from "../validations/box.schema";
import { z } from "zod";
import { Box } from "../../../models/Box";

type CreateInput = z.infer<typeof CreateBoxSchema>;
type UpdateInput = z.infer<typeof UpdateBoxSchema>;
type BulkInventoryInput = z.infer<typeof BulkUpdateInventorySchema>;
type QueryFilters = z.infer<typeof BoxQuerySchema>;

class BoxService {
  /**
   * Create a new box with initial stock validation
   */
  async createBox(data: CreateInput): Promise<Box> {
    // Validate category exists if provided
    if (data.catagroryId) {
      const category = await db.Category.findByPk(data.catagroryId);
      if (!category) {
        throw new Error(`Category with ID ${data.catagroryId} not found`);
      }
    }

    // Ensure current quantity doesn't exceed initial box quantity
    if (data.boxCurrentQuantity > data.boxQuantity) {
      throw new Error("Current quantity cannot exceed total box quantity");
    }

    const box = await db.Box.create(data as any);
    return box;
  }

  /**
   * Get boxes with advanced filtering, pagination, and category include
   */
  async getAllBoxes(filters: QueryFilters) {
    const { page, limit, sortBy, sortOrder, search, type, catagroryId, minPrice, maxPrice, minQuantity, maxQuantity } = filters;
    const offset = (page - 1) * limit;

    const whereClause: any = {};

    // Search across type (as enum) - convert search to lowercase for case-insensitive
    if (search) {
      // For enum fields we can't use LIKE, so we check if search matches any enum value
      const enumValues = ["Softdrink", "Beer", "Wine", "liquor", "other"];
      const matchedTypes = enumValues.filter(v => v.toLowerCase().includes(search.toLowerCase()));
      if (matchedTypes.length > 0) {
        whereClause.type = { [Op.in]: matchedTypes };
      } else {
        // No match, return empty result (but we still need to respect other filters)
        // This is intentional - if search doesn't match any type, no results unless we extend to category name
        // Optionally: join with category to search category name as well
        // For simplicity we'll add a placeholder that won't match anything
        whereClause.id = { [Op.eq]: "00000000-0000-0000-0000-000000000000" };
      }
    }

    if (type) whereClause.type = type;
    if (catagroryId) whereClause.catagroryId = catagroryId;

    // Price filters (using boxbuyingPrice as reference)
    if (minPrice !== undefined) whereClause.boxbuyingPrice = { [Op.gte]: minPrice };
    if (maxPrice !== undefined) {
      whereClause.boxbuyingPrice = { ...whereClause.boxbuyingPrice, [Op.lte]: maxPrice };
    }

    // Quantity filters
    if (minQuantity !== undefined) whereClause.boxCurrentQuantity = { [Op.gte]: minQuantity };
    if (maxQuantity !== undefined) {
      whereClause.boxCurrentQuantity = { ...whereClause.boxCurrentQuantity, [Op.lte]: maxQuantity };
    }

    const includeOptions: any[] = [
      {
        model: db.Category,
        as: "category",
        attributes: ["id", "name"],
        required: false,
      },
    ];

    const { count, rows } = await db.Box.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      distinct: true,
      order: [[sortBy, sortOrder]],
      limit,
      offset,
      subQuery: false,
    });

    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data: rows,
    };
  }

  /**
   * Get single box by ID with category
   */
  async getBoxById(id: string): Promise<Box> {
    const box = await db.Box.findByPk(id, {
      include: [{ model: db.Category, as: "category", attributes: ["id", "name"] }],
    });
    if (!box) {
      throw new Error("Box not found");
    }
    return box;
  }

  /**
   * Update box information with validation
   */
  async updateBox(id: string, data: UpdateInput): Promise<Box> {
    const box = await this.getBoxById(id);

    // Validate category if changing
    if (data.catagroryId !== undefined && data.catagroryId !== null) {
      const category = await db.Category.findByPk(data.catagroryId);
      if (!category) {
        throw new Error(`Category with ID ${data.catagroryId} not found`);
      }
    }

    // Validate quantity constraints
    const newTotalQuantity = data.boxQuantity ?? box.boxQuantity;
    const newCurrentQuantity = data.boxCurrentQuantity ?? box.boxCurrentQuantity;
    if (newCurrentQuantity > newTotalQuantity) {
      throw new Error("Current quantity cannot exceed total box quantity");
    }

    await box.update(data as any);
    return this.getBoxById(id);
  }

  /**
   * Soft delete a box (paranoid)
   * Also prevents deletion if referenced in any BoxTransactionItems
   */
  async deleteBox(id: string): Promise<{ success: boolean; message: string }> {
    const box = await this.getBoxById(id);

    // Check if box is referenced in any transaction items
    const referenceCount = await db.BoxTransactionItems.count({
      where: { boxId: id },
    });
    if (referenceCount > 0) {
      throw new Error(`Cannot delete box: it is referenced in ${referenceCount} transaction(s). Consider marking as inactive instead.`);
    }

    await box.destroy();
    return { success: true, message: "Box deleted successfully" };
  }

  /**
   * Bulk update inventory quantities (for restocking or adjustments)
   * Uses transaction for atomicity
   */
  async bulkUpdateInventory(updates: BulkInventoryInput): Promise<void> {
    if (updates.updates.length === 0) return;

    await db.sequelize.transaction(async (t: Transaction) => {
      for (const update of updates.updates) {
        const box = await db.Box.findByPk(update.id, {
          lock: Transaction.LOCK.UPDATE,
          transaction: t,
        });
        if (!box) {
          throw new Error(`Box with ID ${update.id} not found`);
        }
        if (update.boxCurrentQuantity > box.boxQuantity) {
          throw new Error(`Box ${update.id}: Current quantity cannot exceed total quantity (${box.boxQuantity})`);
        }
        await box.update({ boxCurrentQuantity: update.boxCurrentQuantity }, { transaction: t });
      }
    });
  }

  /**
   * Restock a box (increase current quantity)
   */
  async restockBox(id: string, additionalQuantity: number): Promise<Box> {
    if (additionalQuantity <= 0) {
      throw new Error("Additional quantity must be positive");
    }

    const box = await this.getBoxById(id);
    const newQuantity = box.boxCurrentQuantity + additionalQuantity;
    if (newQuantity > box.boxQuantity) {
      throw new Error(`Cannot restock: would exceed total capacity (${box.boxQuantity}). Current: ${box.boxCurrentQuantity}, Additional: ${additionalQuantity}`);
    }

    await box.update({ boxCurrentQuantity: newQuantity });
    return this.getBoxById(id);
  }

  /**
   * Get low stock boxes (where current quantity <= threshold)
   */
  async getLowStock(threshold: number = 10, limit: number = 50): Promise<Box[]> {
    return await db.Box.findAll({
      where: {
        boxCurrentQuantity: { [Op.lte]: threshold },
      },
      include: [{ model: db.Category, as: "category", attributes: ["id", "name"] }],
      order: [["boxCurrentQuantity", "ASC"]],
      limit,
    });
  }

  /**
   * Get boxes by category with counts
   */
  async getBoxesByCategory(categoryId: string): Promise<{ category: any; boxes: Box[] }> {
    const category = await db.Category.findByPk(categoryId, {
      attributes: ["id", "name"],
    });
    if (!category) {
      throw new Error("Category not found");
    }

    const boxes = await db.Box.findAll({
      where: { catagroryId: categoryId },
      order: [["type", "ASC"]],
    });

    return { category, boxes };
  }

  /**
   * Get inventory summary (total value, counts)
   */
  async getInventorySummary(): Promise<{
    totalBoxes: number;
    totalCurrentQuantity: number;
    totalCapacity: number;
    totalValueAtBuying: number;
    totalValueAtSelling: number;
    lowStockCount: number;
  }> {
    const boxes = await db.Box.findAll({
      attributes: [
        "boxCurrentQuantity",
        "boxQuantity",
        "boxbuyingPrice",
        "boxSellingPrice",
      ],
    });

    let totalCurrentQuantity = 0;
    let totalCapacity = 0;
    let totalValueAtBuying = 0;
    let totalValueAtSelling = 0;
    let lowStockCount = 0;

    for (const box of boxes) {
      totalCurrentQuantity += box.boxCurrentQuantity;
      totalCapacity += box.boxQuantity;
      totalValueAtBuying += box.boxCurrentQuantity * box.boxbuyingPrice;
      totalValueAtSelling += box.boxCurrentQuantity * box.boxSellingPrice;
      if (box.boxCurrentQuantity <= 10) lowStockCount++;
    }

    return {
      totalBoxes: boxes.length,
      totalCurrentQuantity,
      totalCapacity,
      totalValueAtBuying,
      totalValueAtSelling,
      lowStockCount,
    };
  }
}

export default new BoxService();