/**
 * Tests for /api/chat — SSE shape, citations event, intent gating of the
 * booking tool, meeting_booking event, trace instrumentation, x-trace-id
 * header, session cookie, fail-open when Langfuse missing.
 */

const projectChunk = {
  id: "chunk-a",
  sourceType: "project",
  sourceId: "proj-1",
  sourceSlug: "nutrillava",
  sourceTitle: "NutriLLaVA",
  headingPath: ["Overview"],
  content: "A vision-language model for nutrition.",
  score: 0.42,
};

const articleChunk = {
  id: "chunk-b",
  sourceType: "article",
  sourceId: "post-1",
  sourceSlug: "engineering/llm-apr-benchmark",
  sourceTitle: "LLM APR Benchmark",
  headingPath: [],
  content: "Comparison of LLMs for automated program repair.",
  score: 0.39,
};

const intentMock = jest.fn(async () => "researching");
jest.mock("@/lib/chat/intent", () => ({
  classifyIntent: (...args: unknown[]) => intentMock(...args),
  highestPriorityIntent: jest.requireActual("@/lib/chat/intent").highestPriorityIntent,
}));

jest.mock("@/lib/chat/tools", () => ({
  bookMeetingTool: { name: "book_meeting", description: "x", input_schema: { type: "object", properties: {} } },
  getCalcomBookingUrl: jest.fn(() => "https://cal.com/joshlowe/30min?notes=Bot"),
}));

jest.mock("@/lib/rag/vector-search", () => ({
  searchKnowledge: jest.fn(async () => [projectChunk, articleChunk]),
}));

jest.mock("@/lib/bedrock/client", () => {
  const mock = jest.fn(async function* (params: {
    onFirstToken?: () => void;
    onUsage?: (u: { inputTokens?: number; outputTokens?: number }) => void;
    onToolUse?: (call: { name: string; input: Record<string, unknown> }) => void;
    tools?: Array<{ name: string }>;
  }) {
    params.onFirstToken?.();
    params.onUsage?.({ inputTokens: 12, outputTokens: 8 });
    yield "Hello [1]";
    yield " world.";
  });
  return { streamChatResponse: mock, __streamMock: mock };
});

import { __streamMock as streamMock } from "@/lib/bedrock/client";

jest.mock("@/lib/utils/rateLimit", () => ({
  checkRateLimit: jest.fn(async () => true),
}));

import langfuseMock from "../../__mocks__/langfuse";
import prismaMock from "../../__mocks__/prisma";
import handler from "../../pages/api/chat";

interface MockRes {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: string[];
  ended: boolean;
  status(code: number): MockRes;
  setHeader(k: string, v: string | string[]): void;
  getHeader(k: string): string | string[] | undefined;
  write(chunk: string): void;
  end(value?: unknown): void;
  json(value: unknown): void;
  flushHeaders?: () => void;
  headersSent: boolean;
  socket?: { remoteAddress?: string };
}

function createReq(opts: {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
} = {}): unknown {
  return {
    method: opts.method ?? "POST",
    body: opts.body ?? { messages: [{ role: "user", content: "hi" }] },
    headers: opts.headers ?? {},
    cookies: opts.cookies ?? {},
    socket: { remoteAddress: "127.0.0.1" },
  };
}

function createRes(): MockRes {
  const res: MockRes = {
    statusCode: 200,
    headers: {},
    body: [],
    ended: false,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v;
    },
    getHeader(k) {
      return this.headers[k.toLowerCase()];
    },
    write(chunk) {
      this.body.push(chunk);
      this.headersSent = true;
    },
    end() {
      this.ended = true;
    },
    json() {
      this.ended = true;
    },
    flushHeaders() {
      this.headersSent = true;
    },
  };
  return res;
}

const ORIGINAL_ENV = { ...process.env };

describe("/api/chat", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (langfuseMock as unknown as { __resetCalls(): void }).__resetCalls();
    process.env.LANGFUSE_PUBLIC_KEY = "";
    process.env.LANGFUSE_SECRET_KEY = "";
    intentMock.mockResolvedValue("researching");

    // Default ChatSession returned by upsert: not qualified, no booking offered.
    (prismaMock.chatSession.upsert as jest.Mock).mockImplementation(async ({ where, create }) => ({
      id: "sess-row-1",
      sessionId: where.sessionId,
      ipHash: create.ipHash,
      userAgent: create.userAgent,
      qualified: false,
      bookingOffered: false,
      topIntent: null,
      capturedEmail: null,
      capturedName: null,
      langfuseTraceIds: [],
      emailedToOwner: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  });

  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns 405 for non-POST", async () => {
    const req = createReq({ method: "GET" });
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(405);
  });

  it("returns 400 for invalid body", async () => {
    const req = createReq({ body: {} });
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(400);
  });

  it("does NOT expose tools on a researching message", async () => {
    intentMock.mockResolvedValue("researching");
    const req = createReq();
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    expect(streamMock).toHaveBeenCalled();
    const call = streamMock.mock.calls[0][0];
    expect(call.tools).toBeUndefined();
  });

  it("exposes book_meeting tool on an evaluating message", async () => {
    intentMock.mockResolvedValue("evaluating");
    const req = createReq();
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    const call = streamMock.mock.calls[0][0];
    expect(call.tools).toBeDefined();
    expect(call.tools?.[0]?.name).toBe("book_meeting");
  });

  it("does NOT expose tool when bookingOffered is already true", async () => {
    intentMock.mockResolvedValue("evaluating");
    (prismaMock.chatSession.upsert as jest.Mock).mockResolvedValue({
      id: "sess-row-1",
      sessionId: "session-1",
      ipHash: "h",
      userAgent: null,
      qualified: true,
      bookingOffered: true,
      topIntent: "evaluating",
      capturedEmail: null,
      capturedName: null,
      langfuseTraceIds: [],
      emailedToOwner: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const req = createReq();
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    const call = streamMock.mock.calls[0][0];
    expect(call.tools).toBeUndefined();
  });

  it("emits a meeting_booking SSE event when the model fires the tool", async () => {
    intentMock.mockResolvedValue("evaluating");
    streamMock.mockImplementation(async function* (params: {
      onFirstToken?: () => void;
      onUsage?: (u: { inputTokens?: number; outputTokens?: number }) => void;
      onToolUse?: (call: { name: string; input: Record<string, unknown> }) => void;
    }) {
      params.onFirstToken?.();
      yield "Sounds great!";
      params.onToolUse?.({
        name: "book_meeting",
        input: { topicSummary: "Customer support bot", name: "Sarah" },
      });
    });

    const req = createReq();
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);

    const body = res.body.join("");
    expect(body).toContain("event: meeting_booking");
    const match = body.match(/event: meeting_booking\ndata: (.+)\n\n/);
    expect(match).not.toBeNull();
    const payload = JSON.parse(match![1]);
    expect(payload.url).toContain("https://cal.com/");
    expect(payload.message).toContain("30 minutes");
  });

  it("streams citations event on every successful response", async () => {
    const req = createReq();
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    const body = res.body.join("");
    expect(body).toContain("event: citations");
  });

  it("sets session cookie on first request when Langfuse not configured", async () => {
    const req = createReq();
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    expect(String(res.headers["set-cookie"])).toMatch(/chat_session_id=/);
    expect(res.headers["x-trace-id"]).toBeUndefined();
  });

  it("reuses existing session cookie", async () => {
    const sessionId = "11111111-2222-4333-8444-555555555555";
    const req = createReq({ cookies: { chat_session_id: sessionId } });
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });
});
