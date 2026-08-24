import { randomUUID } from "node:crypto";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

/** Matches v1 `lib/observability/session.ts`. HttpOnly so the client never sees it. */
export const COOKIE_NAME = "chat_session_id";
export const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cookieValue(part: string): string | undefined {
  const eq = part.indexOf("=");
  if (eq === -1) return undefined;
  const name = part.slice(0, eq).trim();
  const value = part.slice(eq + 1).trim();
  if (name !== COOKIE_NAME) return undefined;
  if (!UUID_RE.test(value)) return undefined;
  return value;
}

/**
 * Read `chat_session_id` from the Function URL payload. HTTP API v2 may put
 * cookies in `event.cookies` *or* the `Cookie` header; we accept either.
 */
export function parseSessionId(
  event: APIGatewayProxyEventV2,
): string | undefined {
  for (const part of event.cookies ?? []) {
    const id = cookieValue(part);
    if (id) return id;
  }
  const header = event.headers?.cookie ?? event.headers?.Cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const id = cookieValue(part.trim());
    if (id) return id;
  }
  return undefined;
}

export function sessionCookieHeader(id: string): string {
  return `${COOKIE_NAME}=${id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}`;
}

export function getOrMintSessionId(event: APIGatewayProxyEventV2): string {
  return parseSessionId(event) ?? randomUUID();
}
