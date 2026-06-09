// search/SessionSchedule.search.service.ts
import db from '../models';
import { FilterBuilder, FilterCondition } from './filter.builder';
import { QueryCache } from './cache.service';
import { Op } from 'sequelize';

const { SessionSchedule, TradingSession } = db;

export class SessionScheduleSearchService {
  private cache: QueryCache;

  constructor() {
    this.cache = new QueryCache(3600);
  }

  async searchSchedules(
    filters: FilterCondition[],
    page: number = 1,
    limit: number = 50,
    order: [string, 'ASC' | 'DESC'][] = [['effectiveFrom', 'DESC']]
  ): Promise<{ rows: any[]; total: number }> {
    const cacheKey = `schedule_search:${JSON.stringify(filters)}:${page}:${limit}`;
    const cached = this.cache.get<{ rows: any[]; total: number }>(cacheKey);
    if (cached) return cached;

    const builder = new FilterBuilder();
    for (const f of filters) builder.addCondition(f);
    builder.setPagination(limit, page);
    builder.setOrder(order);
    builder.addInclude(TradingSession, 'session', false);

    const { where, order: ord, include, limit: l, offset } = builder.build();

    const result = await SessionSchedule.findAndCountAll({
      where,
      order: ord,
      include,
      limit: l,
      offset,
    });

    this.cache.set(cacheKey, { rows: result.rows, total: result.count });
    return { rows: result.rows, total: result.count };
  }

  async getCurrentSchedule(sessionId: string): Promise<any> {
    const cacheKey = `current_schedule:${sessionId}`;
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const schedule = await SessionSchedule.findOne({
      where: {
        sessionId,
        effectiveFrom: { [Op.lte]: now },
        [Op.or]: [{ effectiveTo: null }, { effectiveTo: { [Op.gte]: now } }],
      },
      order: [['effectiveFrom', 'DESC']],
    });
    if (schedule) this.cache.set(cacheKey, schedule);
    return schedule;
  }
}