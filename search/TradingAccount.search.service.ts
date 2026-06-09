// search/TradingAccount.search.service.ts
import db from '../models';
import { FilterBuilder, FilterCondition } from './filter.builder';
import { QueryCache } from './cache.service';
import { TradeSearchService } from './Trade.search.service';

const TrieService = TradeSearchService;
const { TradingAccount } = db;

type NameTrie = {
  insert(value: string): void;
  searchPrefix(prefix: string): string[];
};

export class TradingAccountSearchService {
  private cache: QueryCache;
  private nameTrie: NameTrie;

  constructor() {
    this.cache = new QueryCache(300);
    this.nameTrie = new TrieService() as unknown as NameTrie;
  }

  async init(): Promise<void> {
    const accounts = await TradingAccount.findAll({ attributes: ['name'] });
    for (const acc of accounts) {
      this.nameTrie.insert(acc.name);
    }
  }

  async searchAccounts(
    filters: FilterCondition[],
    page: number = 1,
    limit: number = 50,
    order: [string, 'ASC' | 'DESC'][] = [['createdAt', 'DESC']]
  ): Promise<{ rows: any[]; total: number }> {
    const cacheKey = `account_search:${JSON.stringify(filters)}:${page}:${limit}`;
    const cached = this.cache.get<{ rows: any[]; total: number }>(cacheKey);
    if (cached) return cached;

    const builder = new FilterBuilder();
    for (const f of filters) builder.addCondition(f);
    builder.setPagination(limit, page);
    builder.setOrder(order);

    const { where, order: ord, include, limit: l, offset } = builder.build();

    const result = await TradingAccount.findAndCountAll({
      where,
      order: ord,
      include,
      limit: l,
      offset,
    });

    this.cache.set(cacheKey, { rows: result.rows, total: result.count });
    return { rows: result.rows, total: result.count };
  }

  async autoCompleteName(prefix: string): Promise<string[]> {
    return (this.nameTrie as any).searchPrefix(prefix);
  }
}