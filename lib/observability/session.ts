import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "node:crypto";

const COOKIE_NAME = "chat_session_id";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Returns the existing chat_session_id cookie if valid, otherwise mints a new
 * UUIDv4 and sets the Set-Cookie header. Must be called BEFORE flushHeaders().
 */
export function getOrCreateSessionId(req: NextApiRequest, res: NextApiResponse): string {
  const existing = req.cookies?.[COOKIE_NAME];
  if (existing && UUID_RE.test(existing)) {
    return existing;
  }
  const id = randomUUID();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}${secure}`,
  );
  return id;
}
