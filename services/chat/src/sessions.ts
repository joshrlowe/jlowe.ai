/**
 * Chat-session contract + pure helpers shared by the memory store (tests)
 * and the DynamoDB store (prod).
 *
 * Sparse GSI: `digestPk` / `digestSk` exist on the item **only** while
 * `qualified && !emailedToOwner`. The digest query (PR 6) is then a GSI
 * Query with no filter and no scan. `digestSk = createdAt` so a range key
 * of `>= cutoff` is chronological.
 */

export const DIGEST_PK_VALUE = "PENDING";
export const RATE_LIMIT_MAX = 10;
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days, sliding

export const RATE_LIMIT_TEXT =
  "You're sending messages a little fast — please wait a moment and try again.";

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  intent?: string;
}

export interface SessionMeta {
  ipHash: string;
  userAgent: string | null;
}

export interface ChatSession {
  sessionId: string;
  ipHash: string;
  userAgent: string | null;
  qualified: boolean;
  bookingOffered: boolean;
  emailedToOwner: boolean;
  topIntent: string | null;
  capturedName: string | null;
  capturedEmail: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: number;
  windowStartMs: number;
  requestCount: number;
  messages: StoredMessage[];
  /** Sparse GSI hash. Present only while qualified && !emailedToOwner. */
  digestPk?: string;
  /** Sparse GSI range = createdAt ISO. */
  digestSk?: string;
}

export interface SessionPatch {
  qualified?: boolean;
  bookingOffered?: boolean;
  emailedToOwner?: boolean;
  topIntent?: string | null;
  capturedName?: string | null;
  capturedEmail?: string | null;
}

export interface RateLimitResult {
  allowed: boolean;
  session: ChatSession;
}

export interface SessionStore {
  checkRateLimit(
    sessionId: string,
    meta: SessionMeta,
    nowMs?: number,
  ): Promise<RateLimitResult>;
  get(sessionId: string): Promise<ChatSession | null>;
  appendMessage(sessionId: string, message: StoredMessage): Promise<void>;
  update(sessionId: string, patch: SessionPatch): Promise<ChatSession | null>;
  /** Sparse GSI query: every row currently qualified && !emailedToOwner. */
  listPending(): Promise<ChatSession[]>;
}

export function ttlEpoch(nowMs: number): number {
  return Math.floor(nowMs / 1000) + SESSION_TTL_SECONDS;
}

export function nextRateLimitState(
  prev: { windowStartMs: number; count: number } | undefined,
  nowMs: number,
): { windowStartMs: number; count: number; allowed: boolean } {
  if (!prev || nowMs - prev.windowStartMs >= RATE_LIMIT_WINDOW_MS) {
    return { windowStartMs: nowMs, count: 1, allowed: true };
  }
  const count = prev.count + 1;
  return {
    windowStartMs: prev.windowStartMs,
    count,
    allowed: count <= RATE_LIMIT_MAX,
  };
}

/** Mutates `session` so GSI keys match the sparse-index invariant. */
export function applyDigestKeys(session: ChatSession): void {
  if (session.qualified && !session.emailedToOwner) {
    session.digestPk = DIGEST_PK_VALUE;
    session.digestSk = session.createdAt;
    return;
  }
  delete session.digestPk;
  delete session.digestSk;
}

export function newSession(
  sessionId: string,
  meta: SessionMeta,
  nowMs: number,
): ChatSession {
  const iso = new Date(nowMs).toISOString();
  const session: ChatSession = {
    sessionId,
    ipHash: meta.ipHash,
    userAgent: meta.userAgent,
    qualified: false,
    bookingOffered: false,
    emailedToOwner: false,
    topIntent: null,
    capturedName: null,
    capturedEmail: null,
    createdAt: iso,
    updatedAt: iso,
    expiresAt: ttlEpoch(nowMs),
    windowStartMs: nowMs,
    requestCount: 0,
    messages: [],
  };
  applyDigestKeys(session);
  return session;
}

export function applyPatch(session: ChatSession, patch: SessionPatch): void {
  if (patch.qualified !== undefined) session.qualified = patch.qualified;
  if (patch.bookingOffered !== undefined) {
    session.bookingOffered = patch.bookingOffered;
  }
  if (patch.emailedToOwner !== undefined) {
    session.emailedToOwner = patch.emailedToOwner;
  }
  if (patch.topIntent !== undefined) session.topIntent = patch.topIntent;
  if (patch.capturedName !== undefined)
    session.capturedName = patch.capturedName;
  if (patch.capturedEmail !== undefined) {
    session.capturedEmail = patch.capturedEmail;
  }
  applyDigestKeys(session);
}
