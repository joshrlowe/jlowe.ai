import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asMessages(value: unknown): StoredMessage[] {
  if (!Array.isArray(value)) return [];
  const out: StoredMessage[] = [];
  for (const row of value) {
    if (!isRecord(row)) continue;
    if (row.role !== "user" && row.role !== "assistant") continue;
    if (typeof row.content !== "string") continue;
    const message: StoredMessage = {
      role: row.role,
      content: row.content,
      createdAt: asString(row.createdAt),
    };
    if (typeof row.intent === "string") message.intent = row.intent;
    out.push(message);
  }
  return out;
}

/** Marshal a session for PutItem. Omits sparse GSI keys when they are unset. */
export function toItem(session: ChatSession): Record<string, unknown> {
  const item: Record<string, unknown> = {
    sessionId: session.sessionId,
    ipHash: session.ipHash,
    qualified: session.qualified,
    bookingOffered: session.bookingOffered,
    emailedToOwner: session.emailedToOwner,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    expiresAt: session.expiresAt,
    windowStartMs: session.windowStartMs,
    requestCount: session.requestCount,
    messages: session.messages,
  };
  if (session.userAgent !== null) item.userAgent = session.userAgent;
  if (session.topIntent !== null) item.topIntent = session.topIntent;
  if (session.capturedName !== null) item.capturedName = session.capturedName;
  if (session.capturedEmail !== null)
    item.capturedEmail = session.capturedEmail;
  if (session.digestPk !== undefined) item.digestPk = session.digestPk;
  if (session.digestSk !== undefined) item.digestSk = session.digestSk;
  return item;
}

export function fromItem(item: Record<string, unknown>): ChatSession {
  const session: ChatSession = {
    sessionId: asString(item.sessionId),
    ipHash: asString(item.ipHash),
    userAgent: asNullableString(item.userAgent),
    qualified: asBool(item.qualified),
    bookingOffered: asBool(item.bookingOffered),
    emailedToOwner: asBool(item.emailedToOwner),
    topIntent: asNullableString(item.topIntent),
    capturedName: asNullableString(item.capturedName),
    capturedEmail: asNullableString(item.capturedEmail),
    createdAt: asString(item.createdAt),
    updatedAt: asString(item.updatedAt),
    expiresAt: asNumber(item.expiresAt),
    windowStartMs: asNumber(item.windowStartMs),
    requestCount: asNumber(item.requestCount),
    messages: asMessages(item.messages),
  };
  if (typeof item.digestPk === "string") session.digestPk = item.digestPk;
  if (typeof item.digestSk === "string") session.digestSk = item.digestSk;
  return session;
}

export class DynamoSessionStore implements SessionStore {
  constructor(
    private readonly tableName: string,
    private readonly doc: DynamoDBDocumentClient = DynamoDBDocumentClient.from(
      new DynamoDBClient({}),
    ),
  ) {}

  async get(sessionId: string): Promise<ChatSession | null> {
    const res = await this.doc.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { sessionId },
      }),
    );
    if (!res.Item) return null;
    return fromItem(res.Item);
  }

  async checkRateLimit(
    sessionId: string,
    meta: SessionMeta,
    nowMs: number = Date.now(),
  ): Promise<RateLimitResult> {
    const existing = await this.get(sessionId);
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
    await this.put(session);
    return { allowed: next.allowed, session };
  }

  async appendMessage(
    sessionId: string,
    message: StoredMessage,
  ): Promise<void> {
    const existing = await this.get(sessionId);
    if (!existing) return;
    existing.messages.push(message);
    existing.updatedAt = message.createdAt;
    await this.put(existing);
  }

  async update(
    sessionId: string,
    patch: SessionPatch,
  ): Promise<ChatSession | null> {
    const existing = await this.get(sessionId);
    if (!existing) return null;
    applyPatch(existing, patch);
    existing.updatedAt = new Date().toISOString();
    await this.put(existing);
    return existing;
  }

  private async put(session: ChatSession): Promise<void> {
    await this.doc.send(
      new PutCommand({
        TableName: this.tableName,
        Item: toItem(session),
      }),
    );
  }
}
