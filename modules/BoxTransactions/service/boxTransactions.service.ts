import { Op, Transaction, Sequelize } from "sequelize";
import db from "../../../models";
import { 
  CreateBoxTransactionSchema, 
  UpdateBoxTransactionSchema,
  AddItemSchema,
  UpdateItemSchema 
} from "../validations/boxTransactions.schema";
import { z } from "zod";
import { BoxTransactionItemsItemAttributes } from "../../../models/BoxTransactionItems";
import { BoxTransactionsAttributes } from "../../../models/BoxTransactions";
import { Box } from "../../../models/Box";

type CreateInput = z.infer<typeof CreateBoxTransactionSchema>;
type UpdateHeaderInput = z.infer<typeof UpdateBoxTransactionSchema>;
type AddItemInput = z.infer<typeof AddItemSchema>;
type UpdateItemInput = z.infer<typeof UpdateItemSchema>;

class BoxTransactionService {
  /**
   * Recalculate soldmoney and profit for a transaction based on its items
   */
  private async recalcHeaderTotals(transactionId: string, dbTransaction?: Transaction) {
    const items = await db.BoxTransactionItems.findAll({
      where: { boxTransactionId: transactionId },
      include: [{ model: db.Box, as: "box", attributes: ["boxbuyingPrice"] }],
      transaction: dbTransaction,
    });

    let soldmoney = 0;
    let totalCost = 0;

    for (const item of items) {
      if (item.states === "sold") {
        const itemTotal = Number(item.price) * item.quantity;
        soldmoney += itemTotal;
        const cost = Number(item.box?.boxbuyingPrice || 0) * item.quantity;
        totalCost += cost;
      }
    }

    const profit = soldmoney - totalCost;

    await db.BoxTransactions.update(
      { soldmoney, profit },
      { where: { id: transactionId }, transaction: dbTransaction }
    );

    return { soldmoney, profit };
  }

  /**
   * Update box inventory based on item changes
   * @param boxId - Box ID
   * @param quantityChange - positive = decrease stock, negative = increase stock (for returns)
   * @param dbTransaction - Sequelize transaction
   */
  private async updateBoxInventory(
    boxId: string,
    quantityChange: number,
    dbTransaction: Transaction
  ): Promise<void> {
    const box = await db.Box.findByPk(boxId, {
      lock: Transaction.LOCK.UPDATE,
      transaction: dbTransaction,
    });

    if (!box) {
      throw new Error(`Box with ID ${boxId} not found`);
    }

    const newQuantity = box.boxCurrentQuantity - quantityChange;
    if (newQuantity < 0) {
      throw new Error(`Insufficient stock for box ${boxId}. Current: ${box.boxCurrentQuantity}, Required: ${quantityChange}`);
    }

    await box.update({ boxCurrentQuantity: newQuantity }, { transaction: dbTransaction });
  }

  /**
   * Create transaction with items and update inventory
   */
  async createTransaction(data: CreateInput) {
    const result = await db.sequelize.transaction(async (t: Transaction) => {
      // Create header
      const transaction = await db.BoxTransactions.create(
        {
          customername: data.customername,
          customerphone: data.customerphone,
          customermoney: data.customermoney,
          soldmoney: 0,
          profit: 0,
          note: data.note,
        },
        { transaction: t }
      );

      // Create items and update inventory
      for (const item of data.items) {
        // Validate box exists and get buying price for later
        const box = await db.Box.findByPk(item.boxId, {
          lock: Transaction.LOCK.UPDATE,
          transaction: t,
        });
        if (!box) {
          throw new Error(`Box with ID ${item.boxId} not found`);
        }

        // Inventory impact: for sold/lost -> decrease, for returned -> increase
        let inventoryChange = 0;
        if (item.states === "sold" || item.states === "lost") {
          inventoryChange = item.quantity;
        } else if (item.states === "returned") {
          inventoryChange = -item.quantity;
        }

        if (inventoryChange !== 0) {
          await this.updateBoxInventory(item.boxId, inventoryChange, t);
        }

        await db.BoxTransactionItems.create(
          {
            boxTransactionId: transaction.id,
            boxId: item.boxId,
            type: item.type,
            conternertype: item.conternertype,
            quantity: item.quantity,
            states: item.states,
            price: item.price,
          },
          { transaction: t }
        );
      }

      // Recalculate totals after all items
      await this.recalcHeaderTotals(transaction.id, t);

      // Fetch complete transaction with items
      return await db.BoxTransactions.findByPk(transaction.id, {
        include: [
          {
            model: db.BoxTransactionItems,
            as: "items",
            include: [{ model: db.Box, as: "box" }],
          },
        ],
        transaction: t,
      });
    });

    return result;
  }

  /**
   * Get all transactions with advanced filtering & pagination
   */
  async getAllTransactions(filters: {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: "ASC" | "DESC";
    search?: string;
    customerName?: string;
    customerPhone?: string;
    startDate?: string;
    endDate?: string;
    state?: string;
    boxId?: string;
  }) {
    const { page, limit, sortBy, sortOrder, search, customerName, customerPhone, startDate, endDate, state, boxId } = filters;
    const offset = (page - 1) * limit;

    const whereClause: any = {};

    // Search across customername and customerphone
    if (search) {
      whereClause[Op.or] = [
        { customername: { [Op.like]: `%${search}%` } },
        { customerphone: { [Op.like]: `%${search}%` } },
      ];
    }

    if (customerName) {
      whereClause.customername = { [Op.like]: `%${customerName}%` };
    }
    if (customerPhone) {
      whereClause.customerphone = { [Op.like]: `%${customerPhone}%` };
    }
    if (startDate) {
      whereClause.createdAt = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      whereClause.createdAt = { ...whereClause.createdAt, [Op.lte]: new Date(endDate) };
    }

    // Filter by item state or boxId requires joining items
    let itemFilter: Record<string, any> | null = null;
    if (state || boxId) {
      itemFilter = {};
      if (state) itemFilter.states = state;
      if (boxId) itemFilter.boxId = boxId;
    }

    const includeOptions: any[] = [
      {
        model: db.BoxTransactionItems,
        as: "items",
        required: !!itemFilter, // becomes INNER JOIN if filtering on items
        where: itemFilter || undefined,
        include: [{ model: db.Box, as: "box" }],
      },
    ];

    const { count, rows } = await db.BoxTransactions.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      distinct: true,
      order: [[sortBy, sortOrder]],
      limit,
      offset,
      subQuery: false, // For performance with includes
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
   * Get single transaction by ID with all items
   */
  async getTransactionById(id: string) {
    const transaction = await db.BoxTransactions.findByPk(id, {
      include: [
        {
          model: db.BoxTransactionItems,
          as: "items",
          include: [{ model: db.Box, as: "box" }],
        },
      ],
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    return transaction;
  }

  /**
   * Update transaction header only (no inventory changes)
   */
  async updateTransactionHeader(id: string, data: UpdateHeaderInput) {
    const transaction = await db.BoxTransactions.findByPk(id);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    await transaction.update(data);
    return this.getTransactionById(id);
  }

  /**
   * Soft delete transaction and revert inventory for all items
   */
  async deleteTransaction(id: string) {
    const transaction = await db.BoxTransactions.findByPk(id, {
      include: [{ model: db.BoxTransactionItems, as: "items" }],
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    await db.sequelize.transaction(async (t: Transaction) => {
      // Revert inventory for each item
      const items = (transaction as any).items || [];
      for (const item of items) {
        let revertChange = 0;
        if (item.states === "sold" || item.states === "lost") {
          // Previously decreased, now increase back
          revertChange = -item.quantity;
        } else if (item.states === "returned") {
          // Previously increased, now decrease back
          revertChange = item.quantity;
        }

        if (revertChange !== 0) {
          await this.updateBoxInventory(item.boxId, revertChange, t);
        }
      }

      // Soft delete (paranoid) will set deletedAt
      await transaction.destroy({ transaction: t });
    });

    return { success: true, message: "Transaction deleted and inventory reverted" };
  }

  /**
   * Add new item to existing transaction
   */
  async addItem(transactionId: string, data: AddItemInput) {
    const transaction = await db.BoxTransactions.findByPk(transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    const result = await db.sequelize.transaction(async (t: Transaction) => {
      // Check if item already exists with same box (optional: prevent duplicates)
      const existing = await db.BoxTransactionItems.findOne({
        where: { boxTransactionId: transactionId, boxId: data.boxId },
        transaction: t,
      });
      if (existing) {
        throw new Error("Item with this box already exists in transaction. Use update instead.");
      }

      // Inventory update
      let inventoryChange = 0;
      if (data.states === "sold" || data.states === "lost") {
        inventoryChange = data.quantity;
      } else if (data.states === "returned") {
        inventoryChange = -data.quantity;
      }

      if (inventoryChange !== 0) {
        await this.updateBoxInventory(data.boxId, inventoryChange, t);
      }

      const newItem = await db.BoxTransactionItems.create(
        {
          boxTransactionId: transactionId,
          boxId: data.boxId,
          type: data.type,
          conternertype: data.conternertype,
          quantity: data.quantity,
          states: data.states,
          price: data.price,
        },
        { transaction: t }
      );

      await this.recalcHeaderTotals(transactionId, t);
      return newItem;
    });

    return result;
  }

  /**
   * Update existing item - handles inventory delta
   */
  async updateItem(transactionId: string, itemId: string, data: UpdateItemInput) {
    const item = await db.BoxTransactionItems.findByPk(itemId, {
      include: [{ model: db.Box, as: "box" }],
    });

    if (!item || item.boxTransactionId !== transactionId) {
      throw new Error("Item not found in this transaction");
    }

    const result = await db.sequelize.transaction(async (t: Transaction) => {
      const oldQuantity = item.quantity;
      const oldState = item.states;
      const newQuantity = data.quantity ?? oldQuantity;
      const newState = data.states ?? oldState;

      // Calculate net inventory effect
      let oldEffect = 0;
      if (oldState === "sold" || oldState === "lost") oldEffect = oldQuantity;
      else if (oldState === "returned") oldEffect = -oldQuantity;

      let newEffect = 0;
      if (newState === "sold" || newState === "lost") newEffect = newQuantity;
      else if (newState === "returned") newEffect = -newQuantity;

      const netChange = newEffect - oldEffect;

      if (netChange !== 0) {
        await this.updateBoxInventory(item.boxId, netChange, t);
      }

      // Update fields
      if (data.quantity !== undefined) item.quantity = data.quantity;
      if (data.states !== undefined) item.states = data.states;
      if (data.price !== undefined) item.price = data.price;
      await item.save({ transaction: t });

      await this.recalcHeaderTotals(transactionId, t);
      return item;
    });

    return result;
  }

  /**
   * Remove item from transaction and revert inventory
   */
  async removeItem(transactionId: string, itemId: string) {
    const item = await db.BoxTransactionItems.findByPk(itemId);

    if (!item || item.boxTransactionId !== transactionId) {
      throw new Error("Item not found in this transaction");
    }

    await db.sequelize.transaction(async (t: Transaction) => {
      // Reverse inventory effect
      let revertChange = 0;
      if (item.states === "sold" || item.states === "lost") {
        revertChange = -item.quantity;
      } else if (item.states === "returned") {
        revertChange = item.quantity;
      }

      if (revertChange !== 0) {
        await this.updateBoxInventory(item.boxId, revertChange, t);
      }

      await item.destroy({ transaction: t });
      await this.recalcHeaderTotals(transactionId, t);
    });

    return { success: true, message: "Item removed" };
  }
}

export default new BoxTransactionService();