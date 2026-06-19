import db from '../models';
import { AdvancedCache } from '../utils/cache.util';
import { ExpenseQueryOptimizer } from '../utils/queryOptimizer.util';
import { CreateExpenseInput, UpdateExpenseInput, ExpenseQueryInput } from '../validations/expense.schema';
import { Op, fn, col, literal } from 'sequelize';

export class ExpenseService {
  private static cache = new AdvancedCache<string, any>(500, 45);

  static async createExpense(data: CreateExpenseInput) {
    const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    const category = await db.ExpenseCategory.findByPk(data.categoryId);
    if (!category) throw new Error('Category not found');

    const expenseData = {
      title: data.title.trim(),
      amount: amount,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
      categoryId: data.categoryId,
      referenceType: data.referenceType || 'general',
      notes: data.notes || null,
      productId: data.productId || null,
      recurringExpenseId: data.recurringExpenseId || null,
      expensePlanId: data.expensePlanId || null,
    };

    const expense = await db.Expense.create(expenseData);
    this.invalidateListCache();

    if (data.expensePlanId) {
      await db.ExpensePlan.increment('currentAllocatedAmount', {
        by: amount,
        where: { id: data.expensePlanId },
      });
    }

    return expense.toJSON();
  }

  static async getExpenseById(id: string) {
    const cacheKey = `expense:${id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const expense = await db.Expense.findByPk(id, {
      include: [
        { model: db.ExpenseCategory, as: 'category', attributes: ['id', 'name'] },
        { model: db.Product, as: 'product', attributes: ['id', 'name'] },
        { model: db.ExpensePlan, as: 'plan', attributes: ['id', 'title'] },
      ],
    });
    if (!expense) throw new Error('Expense not found');
    const expenseJson = expense.toJSON();
    this.cache.set(cacheKey, expenseJson);
    return expenseJson;
  }

  // ── UPDATE EXPENSE ──
  static async updateExpense(id: string, data: UpdateExpenseInput) {
    const expense = await db.Expense.findByPk(id);
    if (!expense) throw new Error('Expense not found');

    // Safely parse the new amount if provided
    let newAmount = expense.amount;
    if (data.amount !== undefined) {
      newAmount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
      if (isNaN(newAmount) || newAmount <= 0) {
        throw new Error('Amount must be a positive number');
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (data.title) updateData.title = data.title.trim();
    if (data.amount !== undefined) updateData.amount = newAmount;
    if (data.expenseDate) updateData.expenseDate = new Date(data.expenseDate);
    if (data.categoryId) {
      const category = await db.ExpenseCategory.findByPk(data.categoryId);
      if (!category) throw new Error('Category not found');
      updateData.categoryId = data.categoryId;
    }
    if (data.referenceType) updateData.referenceType = data.referenceType;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.productId !== undefined) updateData.productId = data.productId || null;
    if (data.recurringExpenseId !== undefined) updateData.recurringExpenseId = data.recurringExpenseId || null;
    if (data.expensePlanId !== undefined) updateData.expensePlanId = data.expensePlanId || null;

    // Update the expense
    await expense.update(updateData);

    // If linked to a plan, refresh allocation (or adjust)
    if (expense.expensePlanId) {
      const diff = newAmount - expense.amount;
      if (diff !== 0) {
        await db.ExpensePlan.increment('currentAllocatedAmount', {
          by: diff,
          where: { id: expense.expensePlanId },
        });
      }
    }

    this.cache.del(`expense:${id}`);
    this.invalidateListCache();
    return expense.toJSON();
  }

  static async deleteExpense(id: string) {
    const expense = await db.Expense.findByPk(id);
    if (!expense) throw new Error('Expense not found');

    if (expense.expensePlanId) {
      await db.ExpensePlan.decrement('currentAllocatedAmount', {
        by: expense.amount,
        where: { id: expense.expensePlanId },
      });
    }

    await expense.destroy();
    this.cache.del(`expense:${id}`);
    this.invalidateListCache();
  }

  static async listExpenses(query: ExpenseQueryInput) {
    const cacheKey = `expenses:${JSON.stringify(query)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const where = ExpenseQueryOptimizer.buildWhereClause(query);
    const order = ExpenseQueryOptimizer.buildOrder(query);
    const { offset, limit } = ExpenseQueryOptimizer.buildPagination(query);

    const { rows, count } = await db.Expense.findAndCountAll({
      where,
      order,
      offset,
      limit,
      include: [
        { model: db.ExpenseCategory, as: 'category', attributes: ['id', 'name'] },
        { model: db.Product, as: 'product', attributes: ['id', 'name'] },
        { model: db.ExpensePlan, as: 'plan', attributes: ['id', 'title'] },
      ],
      distinct: true,
    });

    const result = {
      data: rows.map((r: any) => r.toJSON()),
      pagination: { page: query.page, limit, total: count, pages: Math.ceil(count / limit) },
    };
    this.cache.set(cacheKey, result);
    return result;
  }

  static async getSummary(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate[Op.gte] = startDate;
      if (endDate) where.expenseDate[Op.lte] = endDate;
    }

    const total = await db.Expense.sum('amount', { where });
    const byCategory = await db.Expense.findAll({
      where,
      attributes: [
        [col('categoryId'), 'categoryId'],
        [fn('SUM', col('amount')), 'totalAmount'],
      ],
      include: [{ model: db.ExpenseCategory, as: 'category', attributes: ['name'] }],
      group: ['categoryId', 'category.id'],
      raw: true,
    });

    const byReferenceType = await db.Expense.findAll({
      where,
      attributes: ['referenceType', [fn('SUM', col('amount')), 'total']],
      group: ['referenceType'],
      raw: true,
    });

    return { total, byCategory, byReferenceType };
  }

  private static invalidateListCache() {
    for (const key of this.cache['cache'].keys()) {
      if (typeof key === 'string' && key.startsWith('expenses:')) {
        this.cache.del(key);
      }
    }
  }
}