// search/TradePlan.search.service.ts
import db from '../models';
import { Op } from 'sequelize';
import { FilterBuilder, FilterCondition } from './filter.builder';
import { QueryCache } from './cache.service';

const { TradePlan, TradingAccount, TradingSession } = db;

export class TradePlanSearchService {
  private cache: QueryCache;

  constructor() {
    this.cache = new QueryCache(300);
  }

  async searchPlans(
    filters: FilterCondition[],
    page: number = 1,
    limit: number = 50,
    order: [string, 'ASC' | 'DESC'][] = [['plannedDate', 'DESC']]
  ): Promise<{ rows: any[]; total: number }> {
    const cacheKey = `plan_search:${JSON.stringify(filters)}:${page}:${limit}`;
    const cached = this.cache.get<{ rows: any[]; total: number }>(cacheKey);
    if (cached) return cached;

    const builder = new FilterBuilder();
    for (const f of filters) builder.addCondition(f);
    builder.setPagination(limit, page);
    builder.setOrder(order);
    builder.addInclude(TradingAccount, 'account', false);

    const { where, order: ord, include, limit: l, offset } = builder.build();

    const result = await TradePlan.findAndCountAll({
      where,
      order: ord,
      include,
      limit: l,
      offset,
    });

    this.cache.set(cacheKey, { rows: result.rows, total: result.count });
    return { rows: result.rows, total: result.count };
  }

  async getPendingPlans(): Promise<any[]> {
    const cacheKey = 'pending_plans';
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const plans = await TradePlan.findAll({
      where: { status: 'pending', expiryDate: { [Op.gt]: new Date() } },
      order: [['plannedDate', 'ASC']],
    });
    this.cache.set(cacheKey, plans);
    return plans;
  }
}