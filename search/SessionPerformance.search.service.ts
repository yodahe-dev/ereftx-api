// search/SessionPerformance.search.service.ts
import db from '../models';
import { FilterBuilder, FilterCondition } from './filter.builder';
import { QueryCache } from './cache.service';

const { SessionPerformance, TradingSession } = db;

export class SessionPerformanceSearchService {
  private cache: QueryCache;

  constructor() {
    this.cache = new QueryCache(3600); // longer TTL for aggregated data
  }

  async searchPerformance(
    filters: FilterCondition[],
    page: number = 1,
    limit: number = 50,
    order: [string, 'ASC' | 'DESC'][] = [['date', 'DESC']]
  ): Promise<{ rows: any[]; total: number }> {
    const cacheKey = `perf_search:${JSON.stringify(filters)}:${page}:${limit}`;
    const cached = this.cache.get<{ rows: any[]; total: number }>(cacheKey);
    if (cached) return cached;

    const builder = new FilterBuilder();
    for (const f of filters) builder.addCondition(f);
    builder.setPagination(limit, page);
    builder.setOrder(order);
    builder.addInclude(TradingSession, 'session', false);

    const { where, order: ord, include, limit: l, offset } = builder.build();

    const result = await SessionPerformance.findAndCountAll({
      where,
      order: ord,
      include,
      limit: l,
      offset,
    });

    this.cache.set(cacheKey, { rows: result.rows, total: result.count });
    return { rows: result.rows, total: result.count };
  }

  async getBySessionAndDate(sessionId: string, date: Date): Promise<any> {
    const cacheKey = `perf:${sessionId}:${date.toISOString().split('T')[0]}`;
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const perf = await SessionPerformance.findOne({
      where: { sessionId, date },
      include: [{ model: TradingSession, as: 'session' }],
    });
    if (perf) this.cache.set(cacheKey, perf);
    return perf;
  }
}