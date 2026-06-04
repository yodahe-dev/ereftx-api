import db from '../models';
import { AdvancedCache } from '../utils/cache.util';
import { ExpenseQueryOptimizer } from '../utils/queryOptimizer.util';
import { CreateExpenseInput, UpdateExpenseInput, ExpenseQueryInput } from '../validations/expense.schema';
import { Op, fn, col, literal } from 'sequelize';

export class ExpenseService {
  private static cache = new AdvancedCache<string, any>(500, 45); // 45s TTL

  static async createExpense(data: CreateExpenseInput) {
    const expense = await db.Expense.create({
      ...data,
      amount: data.amount,
    });
    // Invalidate list caches (simple pattern: clear all expense list keys)
    this.invalidateListCache();
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
      ],
    });
    if (!expense) throw new Error('Expense not found');
    const expenseJson = expense.toJSON();
    this.cache.set(cacheKey, expenseJson);
    return expenseJson;
  }

  static async updateExpense(id: string, data: UpdateExpenseInput) {
    const expense = await db.Expense.findByPk(id);
    if (!expense) throw new Error('Expense not found');
    await expense.update(data);
    this.cache.del(`expense:${id}`);
    this.invalidateListCache();
    return expense.toJSON();
  }

  static async deleteExpense(id: string) {
    const expense = await db.Expense.findByPk(id);
    if (!expense) throw new Error('Expense not found');
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
      ],
      distinct: true,
    });

    const result = {
      data: rows.map((r: { toJSON: () => any; }) => r.toJSON()),
      pagination: { page: query.page, limit, total: count, pages: Math.ceil(count / limit) },
    };
    this.cache.set(cacheKey, result);
    return result;
  }

  // Advanced analytics: total expenses by period, category, etc.
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
    // Simple but effective: clear all keys starting with 'expenses:'
    // In production, use redis or pattern matching. Here we iterate.
    for (const key of this.cache['cache'].keys()) {
      if (typeof key === 'string' && key.startsWith('expenses:')) {
        this.cache.del(key);
      }
    }
  }
}