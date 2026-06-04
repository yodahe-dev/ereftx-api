import db from '../models';
import { AdvancedCache } from '../utils/cache.util';
import { Op, fn, col, WhereOptions, Order } from 'sequelize';
import {
  CreateExpensePlanInput,
  UpdateExpensePlanInput,
  ExpensePlanQueryInput,
  ExpensePlanStatusEnum,
} from '../validations/expensePlan.schema';

// Custom LRU + TTL cache (reuse existing util or re-implement here)
// Assuming AdvancedCache from previous step is available.
// If not, we'll include a minimalist version.

export class ExpensePlanService {
  private static cache = new AdvancedCache<string, any>(500, 120); // 2 min TTL

  // ========== CRUD ==========
  static async create(data: CreateExpensePlanInput) {
    const plan = await db.ExpensePlan.create({
      ...data,
      currentAllocatedAmount: 0,
    });
    this.invalidateListCache();
    return plan.toJSON();
  }

  static async getById(id: string, includeExpenses = false) {
    const cacheKey = `plan:${id}:expenses:${includeExpenses}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const include = includeExpenses
      ? [{ model: db.Expense, as: 'expenses', required: false, limit: 1000 }] // limit to avoid overload
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

    // Validate status transition
    if (data.status && data.status !== plan.status) {
      this.validateStatusTransition(plan.status, data.status);
    }

    await plan.update(data);
    this.invalidatePlanCache(id);
    return plan.toJSON();
  }

  static async delete(id: string) {
    const plan = await db.ExpensePlan.findByPk(id);
    if (!plan) throw new Error('Expense plan not found');

    // Check if any expenses linked
    const expenseCount = await db.Expense.count({ where: { expensePlanId: id } });
    if (expenseCount > 0) {
      throw new Error('Cannot delete plan with linked expenses. Reassign or delete expenses first.');
    }

    await plan.destroy();
    this.invalidatePlanCache(id);
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
      data: rows.map((p: { toJSON: () => any; }) => p.toJSON()),
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

  // ========== Allocation Management (Auto-update from linked Expenses) ==========
  /**
   * Recalculate currentAllocatedAmount for a plan based on linked expenses.
   * Uses efficient aggregation query (SUM) instead of loading all records.
   */
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

  /**
   * Call this after any expense create/update/delete that affects a plan.
   * Efficiently updates only the impacted plan.
   */
  static async onExpenseChanged(planId: string | null) {
    if (!planId) return;
    await this.refreshAllocatedAmount(planId);
  }

  // ========== Bulk Operations (for large datasets) ==========
  /**
   * Batch update status for many plans (e.g., mark expired targets as 'cancelled')
   * Uses DSA: batch processing with limit to avoid memory overload.
   */
  static async batchUpdateStatusByCondition(
    condition: (plan: any) => boolean,
    newStatus: typeof ExpensePlanStatusEnum[keyof typeof ExpensePlanStatusEnum],
    batchSize = 1000
  ): Promise<number> {
    let updatedCount = 0;
    let offset = 0;
    while (true) {
      const statusValue = String(newStatus);
      const plans = await db.ExpensePlan.findAll({
        where: { status: { [Op.ne]: statusValue } }, // avoid already updated
        offset,
        limit: batchSize,
        raw: true,
      });
      if (plans.length === 0) break;
      const idsToUpdate: string[] = [];
      for (const plan of plans) {
        if (condition(plan)) idsToUpdate.push(plan.id);
      }
      if (idsToUpdate.length > 0) {
        const [count] = await db.ExpensePlan.update(
          { status: newStatus as any },
          { where: { id: { [Op.in]: idsToUpdate } } }
        );
        updatedCount += count;
        // Invalidate cache for each updated plan
        idsToUpdate.forEach(id => this.invalidatePlanCache(id));
      }
      offset += batchSize;
    }
    this.invalidateListCache();
    return updatedCount;
  }

  // ========== Status Transition Validation ==========
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

  // ========== Cache Invalidation ==========
  private static invalidatePlanCache(planId: string): void {
    // Clear specific plan keys
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