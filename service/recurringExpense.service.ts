import db from '../models';
import { AdvancedCache } from '../utils/cache.util';
import { RecurrenceCalculator } from '../utils/date.util';
import { Op, WhereOptions, Order } from 'sequelize';
import {
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput,
  RecurringExpenseQueryInput,
} from '../validations/recurringExpense.schema';

export class RecurringExpenseService {
  private static cache = new AdvancedCache<string, any>(500, 120); // 2 min TTL

  // ========== CRUD ==========
  static async create(data: CreateRecurringExpenseInput) {
    const recurring = await db.RecurringExpense.create(data);
    this.invalidateListCache();
    return recurring.toJSON();
  }

  static async getById(id: string) {
    const cacheKey = `recurring:${id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const recurring = await db.RecurringExpense.findByPk(id, {
      include: [{ model: db.ExpenseCategory, as: 'category', attributes: ['id', 'name'] }],
    });
    if (!recurring) throw new Error('Recurring expense not found');
    const result = recurring.toJSON();
    this.cache.set(cacheKey, result);
    return result;
  }

  static async update(id: string, data: UpdateRecurringExpenseInput) {
    const recurring = await db.RecurringExpense.findByPk(id);
    if (!recurring) throw new Error('Recurring expense not found');
    await recurring.update(data);
    this.invalidateRecurringCache(id);
    return recurring.toJSON();
  }

  static async delete(id: string) {
    const recurring = await db.RecurringExpense.findByPk(id);
    if (!recurring) throw new Error('Recurring expense not found');
    // Check if any realized expenses exist
    const expenseCount = await db.Expense.count({ where: { recurringExpenseId: id } });
    if (expenseCount > 0) {
      throw new Error('Cannot delete recurring expense that already generated expenses. Deactivate it instead.');
    }
    await recurring.destroy();
    this.invalidateRecurringCache(id);
  }

  static async list(query: RecurringExpenseQueryInput) {
    const cacheKey = `recurring:list:${JSON.stringify(query)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const where: WhereOptions = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.frequency) where.frequency = query.frequency;

    const order: Order = [[query.sortBy, query.sortOrder]];
    const offset = (query.page - 1) * query.limit;

    const { rows, count } = await db.RecurringExpense.findAndCountAll({
      where,
      order,
      offset,
      limit: query.limit,
      include: [{ model: db.ExpenseCategory, as: 'category', attributes: ['id', 'name'] }],
      distinct: true,
    });

    const result = {
      data: rows.map((r: { toJSON: () => any; }) => r.toJSON()),
      pagination: { page: query.page, limit: query.limit, total: count, pages: Math.ceil(count / query.limit) },
    };
    this.cache.set(cacheKey, result);
    return result;
  }

  // ========== Preview upcoming expenses ==========
  static async previewUpcoming(id: string, monthsAhead = 6): Promise<Date[]> {
    const recurring = await db.RecurringExpense.findByPk(id);
    if (!recurring) throw new Error('Recurring expense not found');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + monthsAhead);

    return RecurrenceCalculator.generateOccurrences(
      startDate,
      recurring.frequency,
      recurring.billingDay,
      endDate
    );
  }

  // ========== Cache helpers ==========
  private static invalidateRecurringCache(id: string) {
    for (const key of this.cache['cache'].keys()) {
      if (typeof key === 'string' && (key === `recurring:${id}` || key.startsWith('recurring:list:'))) {
        this.cache.del(key);
      }
    }
  }

  private static invalidateListCache() {
    for (const key of this.cache['cache'].keys()) {
      if (typeof key === 'string' && key.startsWith('recurring:list:')) {
        this.cache.del(key);
      }
    }
  }
}