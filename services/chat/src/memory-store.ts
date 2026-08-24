import {
  applyPatch,
  newSession,
  nextRateLimitState,
  ttlEpoch,
  type ChatSession,
  type RateLimitResult,
  type SessionMeta,
  type SessionPatch,
  type SessionStore,
  type StoredMessage,
} from "./sessions.js";

/** In-process store. Used by tests and as the fail-open fallback when no table is configured. */
export class MemorySessionStore implements SessionStore {
  private readonly rows = new Map<string, ChatSession>();

  /** Test helper: snapshot a row (clone so tests can't mutate the store). */
  snapshot(sessionId: string): ChatSession | undefined {
    const row = this.rows.get(sessionId);
    return row ? structuredClone(row) : undefined;
  }

  async checkRateLimit(
    sessionId: string,
    meta: SessionMeta,
    nowMs: number = Date.now(),
  ): Promise<RateLimitResult> {
    const existing = this.rows.get(sessionId);
    const next = nextRateLimitState(
      existing
        ? {
            windowStartMs: existing.windowStartMs,
            count: existing.requestCount,
          }
        : undefined,
      nowMs,
    );
    const session = existing ?? newSession(sessionId, meta, nowMs);
    session.requestCount = next.count;
    session.windowStartMs = next.windowStartMs;
    session.updatedAt = new Date(nowMs).toISOString();
    session.expiresAt = ttlEpoch(nowMs);
    session.ipHash = meta.ipHash;
    session.userAgent = meta.userAgent;
    this.rows.set(sessionId, session);
    return { allowed: next.allowed, session };
  }

  async get(sessionId: string): Promise<ChatSession | null> {
    const row = this.rows.get(sessionId);
    return row ? structuredClone(row) : null;
  }

  async appendMessage(
    sessionId: string,
    message: StoredMessage,
  ): Promise<void> {
    const row = this.rows.get(sessionId);
    if (!row) return;
    row.messages.push(message);
    row.updatedAt = message.createdAt;
  }

  async update(
    sessionId: string,
    patch: SessionPatch,
  ): Promise<ChatSession | null> {
    const row = this.rows.get(sessionId);
    if (!row) return null;
    applyPatch(row, patch);
    row.updatedAt = new Date().toISOString();
    return structuredClone(row);
  }

  async listPending(): Promise<ChatSession[]> {
    return [...this.rows.values()]
      .filter((row) => row.digestPk !== undefined)
      .map((row) => structuredClone(row));
  }
}
