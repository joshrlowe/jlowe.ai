import { describe, expect, it } from "vitest";

import { MemorySessionStore } from "./memory-store.js";
import {
  applyDigestKeys,
  DIGEST_PK_VALUE,
  newSession,
  nextRateLimitState,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
} from "./sessions.js";
import { fromItem, toItem } from "./dynamo-store.js";

const META = { ipHash: "abc", userAgent: "vitest" };

describe("nextRateLimitState", () => {
  it("allows the first request and the 10th, rejects the 11th in-window", () => {
    const t0 = 1_000_000;
    let state = nextRateLimitState(undefined, t0);
    expect(state).toEqual({
      windowStartMs: t0,
      count: 1,
      allowed: true,
    });
    for (let n = 2; n <= RATE_LIMIT_MAX; n++) {
      state = nextRateLimitState(
        { windowStartMs: state.windowStartMs, count: state.count },
        t0 + 100,
      );
      expect(state.allowed).toBe(true);
      expect(state.count).toBe(n);
    }
    const blocked = nextRateLimitState(
      { windowStartMs: state.windowStartMs, count: state.count },
      t0 + 200,
    );
    expect(blocked.allowed).toBe(false);
    expect(blocked.count).toBe(RATE_LIMIT_MAX + 1);
  });

  it("resets the window after RATE_LIMIT_WINDOW_MS", () => {
    const t0 = 1_000_000;
    const reset = nextRateLimitState(
      { windowStartMs: t0, count: RATE_LIMIT_MAX },
      t0 + RATE_LIMIT_WINDOW_MS,
    );
    expect(reset).toEqual({
      windowStartMs: t0 + RATE_LIMIT_WINDOW_MS,
      count: 1,
      allowed: true,
    });
  });
});

describe("applyDigestKeys (sparse GSI)", () => {
  it("omits keys on a new unqualified session", () => {
    const session = newSession("s1", META, 0);
    expect(session.digestPk).toBeUndefined();
    expect(session.digestSk).toBeUndefined();
    expect("digestPk" in session).toBe(false);
  });

  it("writes keys only while qualified && !emailedToOwner", () => {
    const session = newSession(
      "s1",
      META,
      Date.parse("2026-01-02T00:00:00.000Z"),
    );
    session.qualified = true;
    applyDigestKeys(session);
    expect(session.digestPk).toBe(DIGEST_PK_VALUE);
    expect(session.digestSk).toBe(session.createdAt);

    session.emailedToOwner = true;
    applyDigestKeys(session);
    expect(session.digestPk).toBeUndefined();
    expect(session.digestSk).toBeUndefined();

    session.emailedToOwner = false;
    session.qualified = false;
    applyDigestKeys(session);
    expect(session.digestPk).toBeUndefined();
  });
});

describe("toItem / fromItem", () => {
  it("round-trips and drops sparse keys when they should be absent", () => {
    const session = newSession("s1", META, 1_700_000_000_000);
    session.qualified = true;
    applyDigestKeys(session);
    const withKeys = toItem(session);
    expect(withKeys.digestPk).toBe(DIGEST_PK_VALUE);
    expect(withKeys.digestSk).toBe(session.createdAt);
    expect(fromItem(withKeys).sessionId).toBe("s1");

    session.emailedToOwner = true;
    applyDigestKeys(session);
    const without = toItem(session);
    expect(without).not.toHaveProperty("digestPk");
    expect(without).not.toHaveProperty("digestSk");
    expect(fromItem(without).digestPk).toBeUndefined();
  });
});

describe("MemorySessionStore", () => {
  it("persists turns and flips sparse keys on update()", async () => {
    const store = new MemorySessionStore();
    const { session } = await store.checkRateLimit("s1", META, 10);
    expect(session.digestPk).toBeUndefined();

    await store.appendMessage("s1", {
      role: "user",
      content: "hi",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    const qualified = await store.update("s1", { qualified: true });
    expect(qualified?.digestPk).toBe(DIGEST_PK_VALUE);
    expect(qualified?.digestSk).toBe(session.createdAt);
    expect(qualified?.messages).toHaveLength(1);

    const emailed = await store.update("s1", { emailedToOwner: true });
    expect(emailed?.digestPk).toBeUndefined();
    expect(emailed?.digestSk).toBeUndefined();
  });
});
