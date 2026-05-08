import { TtlCache } from "../../../lib/moderation/cache";

describe("TtlCache", () => {
  it("returns undefined for a missing key", () => {
    const c = new TtlCache<number>();
    expect(c.get("nope")).toBeUndefined();
  });

  it("returns a stored value within the TTL", () => {
    let now = 1_000;
    const c = new TtlCache<string>({ ttlMs: 100, now: () => now });
    c.set("a", "alpha");
    now += 50;
    expect(c.get("a")).toBe("alpha");
  });

  it("evicts a value once its TTL has elapsed", () => {
    let now = 1_000;
    const c = new TtlCache<string>({ ttlMs: 100, now: () => now });
    c.set("a", "alpha");
    now += 200;
    expect(c.get("a")).toBeUndefined();
    expect(c.size()).toBe(0);
  });

  it("evicts the oldest entry when capacity is exceeded", () => {
    const c = new TtlCache<number>({ capacity: 2, ttlMs: 60_000 });
    c.set("a", 1);
    c.set("b", 2);
    c.set("c", 3); // evicts "a"
    expect(c.get("a")).toBeUndefined();
    expect(c.get("b")).toBe(2);
    expect(c.get("c")).toBe(3);
  });

  it("touches a key on read so it survives eviction longer", () => {
    const c = new TtlCache<number>({ capacity: 2, ttlMs: 60_000 });
    c.set("a", 1);
    c.set("b", 2);
    // Read "a" → it becomes MRU. Now inserting "c" should evict "b".
    expect(c.get("a")).toBe(1);
    c.set("c", 3);
    expect(c.get("a")).toBe(1);
    expect(c.get("b")).toBeUndefined();
    expect(c.get("c")).toBe(3);
  });

  it("re-setting an existing key updates the value and refreshes TTL", () => {
    let now = 1_000;
    const c = new TtlCache<number>({ ttlMs: 100, now: () => now });
    c.set("a", 1);
    now += 80;
    c.set("a", 2); // refreshes expiry
    now += 80; // 160 since first set, but only 80 since refresh
    expect(c.get("a")).toBe(2);
  });
});
