// search/TradingSession.search.service.ts
import db from '../models';
import { FilterBuilder, FilterCondition } from './filter.builder';
import { QueryCache } from './cache.service';

const { TradingSession } = db;

export class TradingSessionSearchService {
  private cache: QueryCache;

  constructor() {
    this.cache = new QueryCache(3600); // longer TTL for sessions
  }

  async searchSessions(
    filters: FilterCondition[],
    page: number = 1,
    limit: number = 50,
    order: [string, 'ASC' | 'DESC'][] = [['priority', 'ASC']]
  ): Promise<{ rows: any[]; total: number }> {
    const cacheKey = `session_search:${JSON.stringify(filters)}:${page}:${limit}`;
    const cached = this.cache.get<{ rows: any[]; total: number }>(cacheKey);
    if (cached) return cached;

    const builder = new FilterBuilder();
    for (const f of filters) builder.addCondition(f);
    builder.setPagination(limit, page);
    builder.setOrder(order);

    const { where, order: ord, include, limit: l, offset } = builder.build();

    const result = await TradingSession.findAndCountAll({
      where,
      order: ord,
      include,
      limit: l,
      offset,
    });

    this.cache.set(cacheKey, { rows: result.rows, total: result.count });
    return { rows: result.rows, total: result.count };
  }

  async getSessionByName(name: string): Promise<any> {
    const cacheKey = `session_by_name:${name}`;
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const session = await TradingSession.findOne({ where: { name } });
    if (session) this.cache.set(cacheKey, session);
    return session;
  }

  async getAllSessions(): Promise<any[]> {
    const cacheKey = 'all_sessions';
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const sessions = await TradingSession.findAll({ order: [['priority', 'ASC']] });
    this.cache.set(cacheKey, sessions);
    return sessions;
  }
}