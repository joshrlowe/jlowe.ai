jest.mock("@/lib/utils/rateLimit", () => ({
  checkRateLimit: jest.fn(async () => true),
}));

import handler from "../../../pages/api/chat/feedback";
import { checkRateLimit } from "@/lib/utils/rateLimit";
import langfuseMock from "../../../__mocks__/langfuse";

interface MockRes {
  statusCode: number;
  headers: Record<string, string | string[]>;
  ended: boolean;
  status(code: number): MockRes;
  setHeader(k: string, v: string | string[]): void;
  end(value?: unknown): void;
  json(value: unknown): void;
}

function createReq(method: string, body?: unknown): unknown {
  return {
    method,
    body: body ?? {},
    headers: {},
    cookies: {},
    socket: { remoteAddress: "127.0.0.1" },
  };
}

function createRes(): MockRes {
  return {
    statusCode: 200,
    headers: {},
    ended: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v;
    },
    end() {
      this.ended = true;
    },
    json() {
      this.ended = true;
    },
  };
}

const ORIGINAL_ENV = { ...process.env };

describe("/api/chat/feedback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (langfuseMock as unknown as { __resetCalls(): void }).__resetCalls();
    process.env.LANGFUSE_PUBLIC_KEY = "";
    process.env.LANGFUSE_SECRET_KEY = "";
    (checkRateLimit as jest.Mock).mockImplementation(async () => true);
  });

  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns 405 for non-POST", async () => {
    const req = createReq("GET");
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(405);
  });

  it("returns 400 for missing traceId", async () => {
    const req = createReq("POST", { score: 1 });
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for invalid score", async () => {
    const req = createReq("POST", { traceId: "abc", score: 5 });
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for oversized comment", async () => {
    const req = createReq("POST", {
      traceId: "abc",
      score: 1,
      comment: "x".repeat(1001),
    });
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(400);
  });

  it("returns 204 for valid request even when Langfuse unconfigured (fail-open)", async () => {
    const req = createReq("POST", { traceId: "abc", score: 1 });
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(204);
  });

  it("posts score to Langfuse when configured", async () => {
    process.env.LANGFUSE_PUBLIC_KEY = "pk_test";
    process.env.LANGFUSE_SECRET_KEY = "sk_test";
    jest.resetModules();
    jest.doMock("@/lib/utils/rateLimit", () => ({
      checkRateLimit: jest.fn(async () => true),
    }));
    const reHandler = (await import("../../../pages/api/chat/feedback")).default;
    const reMock = await import("../../../__mocks__/langfuse");

    const req = createReq("POST", { traceId: "abc-123", score: -1, comment: "bad" });
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await reHandler(req as any, res as any);

    expect(res.statusCode).toBe(204);
    const calls = (reMock as unknown as {
      __getCalls(): { kind: string; body?: unknown }[];
    }).__getCalls();
    const score = calls.find((c) => c.kind === "score");
    expect(score).toBeDefined();
    expect(score?.body).toEqual({
      traceId: "abc-123",
      name: "user_feedback",
      value: -1,
      comment: "bad",
    });
  });

  it("short-circuits at rate limit", async () => {
    (checkRateLimit as jest.Mock).mockImplementation(async (_req, res) => {
      res.statusCode = 429;
      res.end();
      return false;
    });
    const req = createReq("POST", { traceId: "abc", score: 1 });
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(429);
  });
});
