// search/TradingSchedule.search.service.ts
import db from '../models';
import { FilterBuilder, FilterCondition } from './filter.builder';
import { QueryCache } from './cache.service';

const { UserTradingSchedule, TradingSession } = db;

export class TradingScheduleSearchService {
  private cache: QueryCache;

  constructor() {
    this.cache = new QueryCache(300);
  }

  async searchSchedules(
    filters: FilterCondition[],
    page: number = 1,
    limit: number = 50,
    order: [string, 'ASC' | 'DESC'][] = [['dayOfWeek', 'ASC']]
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

    const result = await UserTradingSchedule.findAndCountAll({
      where,
      order: ord,
      include,
      limit: l,
      offset,
    });

    this.cache.set(cacheKey, { rows: result.rows, total: result.count });
    return { rows: result.rows, total: result.count };
  }

  async getActiveScheduleForDay(dayOfWeek: number): Promise<any> {
    const cacheKey = `active_schedule:${dayOfWeek}`;
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const schedule = await UserTradingSchedule.findOne({
      where: { dayOfWeek, isActive: true },
      include: [{ model: TradingSession, as: 'session' }],
    });
    this.cache.set(cacheKey, schedule);
    return schedule;
  }
}