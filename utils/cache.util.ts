interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

export class AdvancedCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private maxSize: number;
  private defaultTtlMs: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxSize = 1000, defaultTtlSeconds = 60) {
    this.maxSize = maxSize;
    this.defaultTtlMs = defaultTtlSeconds * 1000;
    // Periodic cleanup every 30 seconds
    this.cleanupInterval = setInterval(() => this.evictExpired(), 30000);
    // Ensure cleanup on process exit
    process.on('beforeExit', () => clearInterval(this.cleanupInterval));
  }

  set(key: K, value: V, ttlMs?: number): void {
    // LRU: if at max size, remove least recently used
    if (this.cache.size >= this.maxSize) {
      let oldestKey: K | null = null;
      let oldestAccess = Date.now();
      for (const [k, entry] of this.cache.entries()) {
        if (entry.lastAccessed < oldestAccess) {
          oldestAccess = entry.lastAccessed;
          oldestKey = k;
        }
      }
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
      lastAccessed: Date.now(),
    });
  }

  get(key: K): V | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    entry.lastAccessed = Date.now(); // update LRU
    return entry.value;
  }

  del(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}