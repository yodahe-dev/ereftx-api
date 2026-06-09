// search/Trade.search.service.ts
import db from '../models';
import { Op } from 'sequelize';
import { FilterBuilder, FilterCondition } from './filter.builder';
import { QueryCache } from './cache.service';
import { SymbolTrie } from './trie.service';

const { TradingSession } = db;

export class TradeSearchService {
  private cache: QueryCache;
  private trie: SymbolTrie;

  constructor() {
    this.cache = new QueryCache(300);
    this.trie = new SymbolTrie();
  }

  async init(): Promise<void> {
    await this.trie.loadFromDB(db);
  }

  async searchTrades(
    filters: FilterCondition[],
    page: number = 1,
    limit: number = 50,
    order: [string, 'ASC' | 'DESC'][] = [['openTimestamp', 'DESC']]
  ): Promise<{ rows: any[]; total: number }> {
    const cacheKey = `trade_search:${JSON.stringify(filters)}:${page}:${limit}:${JSON.stringify(order)}`;
    const cached = this.cache.get<{ rows: any[]; total: number }>(cacheKey);
    if (cached) return cached;

    const builder = new FilterBuilder();
    for (const f of filters) builder.addCondition(f);
    builder.setPagination(limit, page);
    builder.setOrder(order);
    builder.addInclude(TradingSession, 'openSession', false);
    builder.addInclude(TradingSession, 'closeSession', false);

    const { where, order: ord, include, limit: l, offset } = builder.build();

    const result = await db.Trade.findAndCountAll({
      where,
      order: ord,
      include,
      limit: l,
      offset,
    });

    this.cache.set(cacheKey, { rows: result.rows, total: result.count });
    return { rows: result.rows, total: result.count };
  }

  async advancedSearch(
    groups: FilterCondition[][],
    page: number = 1,
    limit: number = 50
  ): Promise<{ rows: any[]; total: number }> {
    const where = {
      [Op.or]: groups.map(group => ({
        [Op.and]: group.map(cond => {
          const f = new FilterBuilder();
          f.addCondition(cond);
          return f.build().where;
        })
      }))
    };
    const offset = (page - 1) * limit;
    const result = await db.Trade.findAndCountAll({
      where,
      limit,
      offset,
      order: [['openTimestamp', 'DESC']],
      include: [{ model: TradingSession, as: 'openSession' }],
    });
    return { rows: result.rows, total: result.count };
  }

  async symbolAutoComplete(prefix: string): Promise<string[]> {
    return this.trie.searchPrefix(prefix);
  }
}
