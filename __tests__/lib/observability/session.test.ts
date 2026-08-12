/**
 * Tests for lib/observability/session.ts — chat_session_id cookie handling.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getOrCreateSessionId } from "@/lib/observability/session";

const VALID_ID = "123e4567-e89b-42d3-a456-426614174000";

function makeReq(cookies: Record<string, string> = {}): NextApiRequest {
  return { cookies } as unknown as NextApiRequest;
}

function makeRes() {
  const headers: Record<string, string> = {};
  return {
    headers,
    setHeader(k: string, v: string) {
      headers[k.toLowerCase()] = v;
    },
  } as unknown as NextApiResponse & { headers: Record<string, string> };
}

describe("getOrCreateSessionId", () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

  afterEach(() => {
    Object.assign(process.env, { NODE_ENV: ORIGINAL_NODE_ENV });
  });

  it("returns an existing valid cookie without setting headers", () => {
    const res = makeRes();
    const id = getOrCreateSessionId(makeReq({ chat_session_id: VALID_ID }), res);
    expect(id).toBe(VALID_ID);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("mints a new UUID and sets an HttpOnly Lax cookie when absent", () => {
    const res = makeRes();
    const id = getOrCreateSessionId(makeReq(), res);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const cookie = res.headers["set-cookie"];
    expect(cookie).toContain(`chat_session_id=${id}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Max-Age=2592000");
    expect(cookie).not.toContain("Secure");
  });

  it("rejects a malformed cookie and mints a fresh id", () => {
    const res = makeRes();
    const id = getOrCreateSessionId(makeReq({ chat_session_id: "not-a-uuid" }), res);
    expect(id).not.toBe("not-a-uuid");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("appends Secure in production", () => {
    Object.assign(process.env, { NODE_ENV: "production" });
    const res = makeRes();
    getOrCreateSessionId(makeReq(), res);
    expect(res.headers["set-cookie"]).toContain("; Secure");
  });
});
