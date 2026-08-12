/**
 * Tests for lib/observability/ip.ts — client IP extraction + privacy hash.
 */

import type { NextApiRequest } from "next";
import { getClientIp, hashIp } from "@/lib/observability/ip";

function makeReq(headers: Record<string, unknown> = {}, remoteAddress?: string): NextApiRequest {
  return { headers, socket: { remoteAddress } } as unknown as NextApiRequest;
}

describe("getClientIp", () => {
  it("takes the first entry of a comma-separated x-forwarded-for", () => {
    expect(getClientIp(makeReq({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });

  it("trims whitespace around the forwarded address", () => {
    expect(getClientIp(makeReq({ "x-forwarded-for": "  9.9.9.9  ,8.8.8.8" }))).toBe("9.9.9.9");
  });

  it("returns unknown for an empty x-forwarded-for", () => {
    expect(getClientIp(makeReq({ "x-forwarded-for": "" }))).toBe("unknown");
  });

  it("falls back to x-real-ip", () => {
    expect(getClientIp(makeReq({ "x-real-ip": "2.2.2.2" }))).toBe("2.2.2.2");
  });

  it("falls back to the socket remote address", () => {
    expect(getClientIp(makeReq({}, "127.0.0.1"))).toBe("127.0.0.1");
  });

  it("returns unknown when nothing is available", () => {
    expect(getClientIp(makeReq())).toBe("unknown");
  });
});

describe("hashIp", () => {
  it("returns a 16-char hex digest, stable for the same input", () => {
    const a = hashIp("1.2.3.4");
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(hashIp("1.2.3.4")).toBe(a);
  });

  it("differs across inputs", () => {
    expect(hashIp("1.2.3.4")).not.toBe(hashIp("4.3.2.1"));
  });
});
