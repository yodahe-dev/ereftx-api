import db from '../models';
import { AdvancedCache } from '../utils/cache.util';
import { ExpenseQueryOptimizer } from '../utils/queryOptimizer.util';
import { CreateExpenseInput, UpdateExpenseInput, ExpenseQueryInput } from '../validations/expense.schema';
import { Op, fn, col, literal } from 'sequelize';

export class ExpenseService {
  static getSummary(arg0: Date | undefined, arg1: Date | undefined) {
    throw new Error('Method not implemented.');
  }
  private static cache = new AdvancedCache<string, any>(500, 45);

  static async createExpense(data: CreateExpenseInput) {
    // Ensure amount is a number
    const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    // Ensure category exists
    const category = await db.ExpenseCategory.findByPk(data.categoryId);
    if (!category) throw new Error('Category not found');

    // Build expense object
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

    // If linked to a plan, refresh allocation
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

  static async updateExpense(id: string, data: UpdateExpenseInput) {
    const expense = await db.Expense.findByPk(id);
    if (!expense) throw new Error('Expense not found');

    // Handle amount change – update plan allocation if linked
    const oldAmount = expense.amount;
    const newAmount = data.amount !== undefined ? (typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount) : oldAmount;

    // Update the expense
    const updateData: any = { ...data };
    if (data.amount !== undefined) updateData.amount = newAmount;
    if (data.expenseDate) updateData.expenseDate = new Date(data.expenseDate);
    if (data.title) updateData.title = data.title.trim();
    if (data.referenceType) updateData.referenceType = data.referenceType;

    await expense.update(updateData);

    // If linked to a plan, update allocation
    if (expense.expensePlanId) {
      const diff = newAmount - oldAmount;
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

    // If linked to a plan, reduce allocation
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

  // ... (summary method can stay as is) ...

  private static invalidateListCache() {
    for (const key of this.cache['cache'].keys()) {
      if (typeof key === 'string' && key.startsWith('expenses:')) {
        this.cache.del(key);
      }
    }
  }
}