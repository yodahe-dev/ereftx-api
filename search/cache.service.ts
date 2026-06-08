// search/cache.service.ts
import NodeCache from 'node-cache';

export class QueryCache {
  private cache: NodeCache;

  constructor(ttlSeconds: number = 300) {
    this.cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: 60 });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl !== undefined) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  del(pattern: string): void {
    const keys = this.cache.keys().filter(k => k.includes(pattern));
    this.cache.del(keys);
  }

  flush(): void {
    this.cache.flushAll();
  }
}