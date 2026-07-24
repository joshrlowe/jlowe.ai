/**
 * Tests for the NextAuth handler wrapper — the credentials-callback POST is
 * rate-limited (by IP) before NextAuth runs; every other route passes through.
 */

jest.mock("@/lib/utils/rateLimit", () => ({
  checkRateLimit: jest.fn(async () => true),
}));

// next-auth + the credentials provider are resolved through an ESM/CJS interop
// shim in the route; return `{ __esModule, default }` so the default import is
// the callable the shim expects.
jest.mock("next-auth", () => {
  const fn = jest.fn((_req: unknown, res: { status(c: number): { json(v: unknown): void } }) => {
    res.status(200).json({ ok: true });
  });
  return { __esModule: true, default: fn };
});

jest.mock("next-auth/providers/credentials", () => {
  const fn = jest.fn((opts: unknown) => opts);
  return { __esModule: true, default: fn };
});

import handler from "@/pages/api/auth/[...nextauth]";
import NextAuthMock from "next-auth";
import { checkRateLimit } from "@/lib/utils/rateLimit";

interface MockRes {
  statusCode: number;
  ended: boolean;
  status(code: number): MockRes;
  json(value: unknown): void;
  setHeader(k: string, v: string): void;
  end(): void;
}

function createReq(method: string, nextauth: string[]): unknown {
  return {
    method,
    query: { nextauth },
    headers: {},
    cookies: {},
    body: {},
    socket: { remoteAddress: "127.0.0.1" },
  };
}

function createRes(): MockRes {
  return {
    statusCode: 200,
    ended: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json() {
      this.ended = true;
    },
    setHeader() {},
    end() {
      this.ended = true;
    },
  };
}

describe("/api/auth/[...nextauth] wrapper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockImplementation(async () => true);
  });

  it("rate-limits the credentials callback POST before running NextAuth", async () => {
    const req = createReq("POST", ["callback", "credentials"]);
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);

    expect(checkRateLimit).toHaveBeenCalledWith(req, res, {
      maxRequests: 5,
      windowSeconds: 60,
      keyPrefix: "login",
    });
    expect(NextAuthMock).toHaveBeenCalledTimes(1);
  });

  it("does not run NextAuth when the login limit is exceeded", async () => {
    (checkRateLimit as jest.Mock).mockImplementation(async (_req, res: MockRes) => {
      res.status(429).json({ error: "Too many requests. Please try again later." });
      return false;
    });
    const req = createReq("POST", ["callback", "credentials"]);
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);

    expect(res.statusCode).toBe(429);
    expect(NextAuthMock).not.toHaveBeenCalled();
  });

  it("does not rate-limit the session GET", async () => {
    const req = createReq("GET", ["session"]);
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);

    expect(checkRateLimit).not.toHaveBeenCalled();
    expect(NextAuthMock).toHaveBeenCalledTimes(1);
  });

  it("does not rate-limit a non-credentials callback POST", async () => {
    const req = createReq("POST", ["signin", "credentials"]);
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);

    expect(checkRateLimit).not.toHaveBeenCalled();
    expect(NextAuthMock).toHaveBeenCalledTimes(1);
  });
});
