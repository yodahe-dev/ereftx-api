import db from '../models';
import { AdvancedCache } from '../utils/cache.util';
import { Op, fn, col, WhereOptions, Order } from 'sequelize';
import {
  CreateExpensePlanInput,
  UpdateExpensePlanInput,
  ExpensePlanQueryInput,
  ExpensePlanStatusEnum,
} from '../validations/expensePlan.schema';

export class ExpensePlanService {
  private static cache = new AdvancedCache<string, any>(500, 120);

  static async create(data: CreateExpensePlanInput) {
    // Ensure amount is a number
    const targetAmount = typeof data.targetAmount === 'string' ? parseFloat(data.targetAmount) : data.targetAmount;
    if (isNaN(targetAmount) || targetAmount <= 0) {
      throw new Error('Target amount must be a positive number');
    }

    const plan = await db.ExpensePlan.create({
      title: data.title.trim(),
      targetAmount: targetAmount,
      currentAllocatedAmount: 0,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      status: data.status || 'planned',
      notes: data.notes || null,
    });
    this.invalidateListCache();
    return plan.toJSON();
  }

  static async getById(id: string, includeExpenses = false) {
    const cacheKey = `plan:${id}:expenses:${includeExpenses}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const include = includeExpenses
      ? [{ model: db.Expense, as: 'expenses', required: false, limit: 1000 }]
      : [];

    const plan = await db.ExpensePlan.findByPk(id, { include });
    if (!plan) throw new Error('Expense plan not found');
    const result = plan.toJSON();
    this.cache.set(cacheKey, result);
    return result;
  }

  static async update(id: string, data: UpdateExpensePlanInput) {
    const plan = await db.ExpensePlan.findByPk(id);
    if (!plan) throw new Error('Expense plan not found');

    if (data.status && data.status !== plan.status) {
      this.validateStatusTransition(plan.status, data.status);
    }

    const updateData: any = { ...data };
    if (data.targetAmount !== undefined) {
      updateData.targetAmount = typeof data.targetAmount === 'string' ? parseFloat(data.targetAmount) : data.targetAmount;
    }
    if (data.targetDate) updateData.targetDate = new Date(data.targetDate);
    if (data.title) updateData.title = data.title.trim();

    await plan.update(updateData);
    this.invalidatePlanCache(id);
    return plan.toJSON();
  }

  static async delete(id: string) {
    const plan = await db.ExpensePlan.findByPk(id);
    if (!plan) throw new Error('Expense plan not found');

    const expenseCount = await db.Expense.count({ where: { expensePlanId: id } });
    if (expenseCount > 0) {
      throw new Error(`Cannot delete plan with ${expenseCount} linked expenses. Reassign or delete expenses first.`);
    }

    const transaction = await db.sequelize.transaction();
    try {
      await plan.destroy({ transaction });
      await transaction.commit();
      this.invalidatePlanCache(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async list(query: ExpensePlanQueryInput) {
    const cacheKey = `plans:${JSON.stringify(query)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const where: WhereOptions = {};
    if (query.status) where.status = query.status;
    if (query.minTargetAmount !== undefined || query.maxTargetAmount !== undefined) {
      where.targetAmount = {};
      if (query.minTargetAmount !== undefined) where.targetAmount[Op.gte] = query.minTargetAmount;
      if (query.maxTargetAmount !== undefined) where.targetAmount[Op.lte] = query.maxTargetAmount;
    }
    if (query.startTargetDate || query.endTargetDate) {
      where.targetDate = {};
      if (query.startTargetDate) where.targetDate[Op.gte] = query.startTargetDate;
      if (query.endTargetDate) where.targetDate[Op.lte] = query.endTargetDate;
    }

    const order: Order = [[query.sortBy, query.sortOrder]];
    const offset = (query.page - 1) * query.limit;

    const include = query.includeExpenses
      ? [{ model: db.Expense, as: 'expenses', required: false, limit: 100 }]
      : [];

    const { rows, count } = await db.ExpensePlan.findAndCountAll({
      where,
      order,
      offset,
      limit: query.limit,
      include,
      distinct: true,
    });

    const result = {
      data: rows.map((p: any) => p.toJSON()),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count,
        pages: Math.ceil(count / query.limit),
      },
    };
    this.cache.set(cacheKey, result);
    return result;
  }

  static async refreshAllocatedAmount(planId: string): Promise<number> {
    const result = await db.Expense.sum('amount', {
      where: { expensePlanId: planId },
    });
    const total = Number(result) || 0;
    await db.ExpensePlan.update(
      { currentAllocatedAmount: total },
      { where: { id: planId } }
    );
    this.invalidatePlanCache(planId);
    return total;
  }

  // ... (other methods unchanged) ...

  private static validateStatusTransition(from: string, to: string): void {
    const allowedTransitions: Record<string, string[]> = {
      planned: ['active', 'cancelled'],
      active: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };
    if (!allowedTransitions[from]?.includes(to)) {
      throw new Error(`Invalid status transition from ${from} to ${to}`);
    }
  }

  private static invalidatePlanCache(planId: string): void {
    for (const key of this.cache['cache'].keys()) {
      if (typeof key === 'string' && key.startsWith(`plan:${planId}`)) {
        this.cache.del(key);
      }
    }
    this.invalidateListCache();
  }

  private static invalidateListCache(): void {
    for (const key of this.cache['cache'].keys()) {
      if (typeof key === 'string' && key.startsWith('plans:')) {
        this.cache.del(key);
      }
    }
  }
}