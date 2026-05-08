/**
 * Tiny in-process LRU + TTL cache for moderation results.
 *
 * Scope: dedupe identical (content, postTopic) submissions inside a
 * 5-minute window. We don't reach for Redis — the hit rate isn't high
 * enough to matter and the cache is allowed to be process-local.
 *
 * Eviction: when capacity is exceeded the oldest insertion is dropped.
 * Map iteration order is insertion order, so a `keys().next()` gives
 * the LRU candidate. Re-reading a key bumps it to the back via
 * delete+set so frequently-hit entries survive eviction.
 */

interface Entry<V> {
  value: V;
  expiresAt: number;
}

export interface TtlCacheOptions {
  capacity?: number;
  ttlMs?: number;
  /** Test seam — defaults to Date.now. */
  now?: () => number;
}

export class TtlCache<V> {
  private readonly map = new Map<string, Entry<V>>();
  private readonly capacity: number;
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(options: TtlCacheOptions = {}) {
    this.capacity = options.capacity ?? 50;
    this.ttlMs = options.ttlMs ?? 5 * 60 * 1000;
    this.now = options.now ?? (() => Date.now());
  }

  get(key: string): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.map.delete(key);
      return undefined;
    }
    // Touch — move to most-recently-used position.
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expiresAt: this.now() + this.ttlMs });
    if (this.map.size > this.capacity) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) this.map.delete(oldestKey);
    }
  }

  /** Test/inspection only. */
  size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }
}
