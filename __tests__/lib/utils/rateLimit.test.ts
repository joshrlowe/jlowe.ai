/**
 * Tests for lib/utils/rateLimit.ts — Upstash sliding-window limiter with
 * deliberate fail-open behavior when unconfigured or erroring.
 */

import type { NextApiRequest, NextApiResponse } from "next";

const limitMock = jest.fn();
const slidingWindowMock = jest.fn(() => "sliding-window-limiter");
const RatelimitMock = jest.fn(() => ({ limit: limitMock }));
(RatelimitMock as unknown as { slidingWindow: jest.Mock }).slidingWindow = slidingWindowMock;
const RedisMock = jest.fn();

jest.mock("@upstash/ratelimit", () => ({ Ratelimit: RatelimitMock }));
jest.mock("@upstash/redis", () => ({ Redis: RedisMock }));

import { checkRateLimit } from "@/lib/utils/rateLimit";

function makeReq(ip = "1.2.3.4"): NextApiRequest {
  return { headers: { "x-forwarded-for": ip }, socket: {} } as unknown as NextApiRequest;
}

function makeRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(value: unknown) {
      this.body = value;
    },
  };
  return res as unknown as NextApiResponse & { statusCode: number; body: unknown };
}

const CONFIG = { maxRequests: 10, windowSeconds: 60, keyPrefix: "chat" };
const ORIGINAL_ENV = { ...process.env };

describe("checkRateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
  });

  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("fails open (allows) when Upstash env vars are absent", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    await expect(checkRateLimit(makeReq(), makeRes(), CONFIG)).resolves.toBe(true);
    expect(RedisMock).not.toHaveBeenCalled();
  });

  it("allows the request when under the limit", async () => {
    limitMock.mockResolvedValueOnce({ success: true });
    const res = makeRes();

    await expect(checkRateLimit(makeReq("9.9.9.9"), res, CONFIG)).resolves.toBe(true);

    expect(RedisMock).toHaveBeenCalledWith({
      url: "https://fake.upstash.io",
      token: "token",
    });
    expect(slidingWindowMock).toHaveBeenCalledWith(10, "60 s");
    expect(RatelimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: "chat", limiter: "sliding-window-limiter" })
    );
    expect(limitMock).toHaveBeenCalledWith("9.9.9.9");
    expect(res.statusCode).toBe(200);
  });

  it("sends 429 and returns false when over the limit", async () => {
    limitMock.mockResolvedValueOnce({ success: false });
    const res = makeRes();

    await expect(checkRateLimit(makeReq(), res, CONFIG)).resolves.toBe(false);

    expect(res.statusCode).toBe(429);
    expect(res.body).toEqual({ error: "Too many requests. Please try again later." });
  });

  it("defaults the key prefix to 'ratelimit'", async () => {
    limitMock.mockResolvedValueOnce({ success: true });

    await checkRateLimit(makeReq(), makeRes(), { maxRequests: 5, windowSeconds: 30 });

    expect(RatelimitMock).toHaveBeenCalledWith(expect.objectContaining({ prefix: "ratelimit" }));
  });

  it("fails open when the limiter throws", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    limitMock.mockRejectedValueOnce(new Error("redis down"));
    const res = makeRes();

    await expect(checkRateLimit(makeReq(), res, CONFIG)).resolves.toBe(true);

    expect(res.statusCode).toBe(200);
    expect(warn).toHaveBeenCalledWith("[rateLimit] check failed:", "redis down");
    warn.mockRestore();
  });
});
