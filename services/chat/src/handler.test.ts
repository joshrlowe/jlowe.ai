import type { RetrievedChunk } from "@velocity/corpus-index";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { beforeEach, describe, expect, it } from "vitest";

import { CONTEXT_PREAMBLE } from "./citations.js";
import {
  CHAT_FRAMES_ACCEPT,
  CHAT_FRAMES_CONTENT_TYPE,
  CHAT_RAW_CONTENT_TYPE,
} from "./frames.js";
import { COOKIE_NAME } from "./cookie.js";
import {
  FAIL_OPEN_TEXT,
  handleChatEvent,
  type ChatRuntime,
  type TokenArgs,
} from "./handler.js";
import { NOOP_TRACE, type TraceHandle } from "./langfuse.js";
import { BOOKING_CTA } from "./tools.js";
import { MemorySessionStore } from "./memory-store.js";
import {
  RATE_LIMIT_MAX,
  RATE_LIMIT_TEXT,
  type SessionStore,
} from "./sessions.js";

const captured = (
  globalThis as typeof globalThis & {
    __chatCapture: {
      writes: string[];
      headers: Record<string, string> | undefined;
      statusCode: number | undefined;
      ended: boolean;
    };
  }
).__chatCapture;

function resetCaptured(): void {
  captured.writes = [];
  captured.headers = undefined;
  captured.statusCode = undefined;
  captured.ended = false;
}

const jarvis: RetrievedChunk = {
  id: "project:jarvis:0",
  sourceType: "project",
  sourceId: "jarvis",
  sourceSlug: "jarvis",
  sourceTitle: "Jarvis",
  headingPath: [],
  content: "Jarvis is a self-hosted assistant.",
  score: 0.5,
};

function makeEvent(
  body: unknown,
  headers: Record<string, string> = {},
  cookies?: string[],
): APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: "POST /",
    rawPath: "/",
    rawQueryString: "",
    headers,
    ...(cookies ? { cookies } : {}),
    requestContext: {
      accountId: "1",
      apiId: "api",
      domainName: "example.execute-api.us-east-1.amazonaws.com",
      domainPrefix: "example",
      http: {
        method: "POST",
        path: "/",
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "vitest",
      },
      requestId: "req",
      routeKey: "POST /",
      stage: "$default",
      time: "now",
      timeEpoch: 0,
    },
    isBase64Encoded: false,
    body: typeof body === "string" ? body : JSON.stringify(body),
  };
}

async function run(
  event: APIGatewayProxyEventV2,
  runtime: ChatRuntime,
): Promise<void> {
  await handleChatEvent(
    event,
    {} as unknown as awslambda.ResponseStream,
    runtime,
  );
}

function okRuntime(extras: Partial<ChatRuntime> = {}): ChatRuntime {
  return {
    search: async () => [jarvis],
    tokens: async function* () {
      yield "Hello";
      yield " world";
    },
    classifyIntent: async () => "researching",
    calcomConfigured: false,
    ...extras,
  };
}

beforeEach(() => {
  resetCaptured();
});

describe("handleChatEvent Accept negotiation", () => {
  it("streams raw text/plain deltas for today's clients", async () => {
    let grounded = "";
    await run(
      makeEvent({ messages: [{ role: "user", content: "what is jarvis" }] }),
      okRuntime({
        tokens: async function* ({ system }) {
          grounded = system;
          yield "Hello";
          yield " world";
        },
      }),
    );

    expect(captured.headers?.["content-type"]).toBe(CHAT_RAW_CONTENT_TYPE);
    expect(captured.writes.join("")).toBe("Hello world");
    expect(captured.writes.some((w) => w.includes('"type":'))).toBe(false);
    expect(grounded).toContain(CONTEXT_PREAMBLE);
    expect(grounded).toContain("Jarvis is a self-hosted assistant.");
    expect(captured.ended).toBe(true);
  });

  it("streams ndjson frames when Accept is application/x-jlowe-chat-frames", async () => {
    await run(
      makeEvent(
        { messages: [{ role: "user", content: "what is jarvis" }] },
        { accept: CHAT_FRAMES_ACCEPT },
      ),
      okRuntime(),
    );

    expect(captured.headers?.["content-type"]).toBe(CHAT_FRAMES_CONTENT_TYPE);
    const body = captured.writes.join("");
    expect(body).toContain('"type":"meta"');
    expect(body).toContain('"chunkCount":1');
    expect(body).toContain('{"type":"text","content":"Hello"}\n\n');
    expect(body).toContain('{"type":"text","content":" world"}\n\n');
    expect(body).toContain('"type":"citations"');
    expect(body).toContain("/projects/jarvis/");
    expect(body.endsWith('{"type":"done"}\n\n')).toBe(true);
    expect(body).not.toContain('"type":"error"');
  });

  it("treats text/event-stream as framed, reading Accept from either case", async () => {
    await run(
      makeEvent(
        { messages: [{ role: "user", content: "hi" }] },
        { Accept: "text/event-stream" },
      ),
      okRuntime(),
    );
    expect(captured.headers?.["content-type"]).toBe(CHAT_FRAMES_CONTENT_TYPE);
    expect(captured.writes.join("")).toContain('"type":"done"');
  });
});

describe("handleChatEvent fail-open", () => {
  it("writes the friendly line in raw mode when the model throws", async () => {
    await run(
      makeEvent({ messages: [{ role: "user", content: "hi" }] }),
      okRuntime({
        search: async () => [],
        tokens: async function* () {
          yield* [];
          throw new Error("bedrock down");
        },
      }),
    );
    expect(captured.headers?.["content-type"]).toBe(CHAT_RAW_CONTENT_TYPE);
    expect(captured.writes.join("")).toBe(`\n\n${FAIL_OPEN_TEXT}`);
    expect(captured.ended).toBe(true);
  });

  it("writes the friendly line in raw mode on a malformed body", async () => {
    await run(makeEvent("{not json"), okRuntime());
    expect(captured.writes.join("")).toBe(`\n\n${FAIL_OPEN_TEXT}`);
  });

  it("replaces citations with error then done in framed mode", async () => {
    await run(
      makeEvent(
        { messages: [{ role: "user", content: "hi" }] },
        { accept: CHAT_FRAMES_ACCEPT },
      ),
      okRuntime({
        search: async () => [jarvis],
        tokens: async function* () {
          yield "partial";
          throw new Error("stream died");
        },
      }),
    );
    const body = captured.writes.join("");
    expect(body).toContain('"type":"meta"');
    expect(body).toContain('{"type":"text","content":"partial"}\n\n');
    expect(body).toContain(
      `{"type":"error","message":"${FAIL_OPEN_TEXT}"}\n\n`,
    );
    expect(body).toContain('{"type":"done"}\n\n');
    expect(body).not.toContain('"type":"citations"');
  });
});

describe("handleChatEvent sessions", () => {
  const SESSION = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

  it("sets the HttpOnly cookie on the stream prelude before any write", async () => {
    await run(
      makeEvent({ messages: [{ role: "user", content: "hi" }] }),
      okRuntime({ sessions: new MemorySessionStore() }),
    );
    const setCookie = captured.headers?.["set-cookie"] ?? "";
    expect(setCookie.startsWith(`${COOKIE_NAME}=`)).toBe(true);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(captured.statusCode).toBe(200);
    expect(captured.ended).toBe(true);
  });

  it("reuses a valid incoming cookie instead of minting", async () => {
    const store = new MemorySessionStore();
    await run(
      makeEvent({ messages: [{ role: "user", content: "hi" }] }, {}, [
        `${COOKIE_NAME}=${SESSION}`,
      ]),
      okRuntime({ sessions: store }),
    );
    expect(captured.headers?.["set-cookie"]).toContain(
      `${COOKIE_NAME}=${SESSION}`,
    );
    const row = store.snapshot(SESSION);
    expect(row?.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(row?.messages[0]?.content).toBe("hi");
    expect(row?.messages[1]?.content).toBe("Hello world");
    expect(row?.digestPk).toBeUndefined();
  });

  it("returns 429 and does not call the model on the 11th request in-window", async () => {
    const store = new MemorySessionStore();
    const runtime = okRuntime({
      sessions: store,
      tokens: async function* () {
        yield "ok";
      },
    });
    const event = makeEvent(
      { messages: [{ role: "user", content: "hi" }] },
      { accept: CHAT_FRAMES_ACCEPT },
      [`${COOKIE_NAME}=${SESSION}`],
    );
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      resetCaptured();
      await run(event, runtime);
      expect(captured.statusCode).toBe(200);
    }
    resetCaptured();
    let called = false;
    await run(event, {
      ...runtime,
      tokens: async function* () {
        called = true;
        yield "should-not-run";
      },
    });
    expect(called).toBe(false);
    expect(captured.statusCode).toBe(429);
    expect(captured.headers?.["set-cookie"]).toContain(
      `${COOKIE_NAME}=${SESSION}`,
    );
    expect(captured.writes.join("")).toContain(
      `{"type":"error","message":"${RATE_LIMIT_TEXT}"}`,
    );
    expect(captured.writes.join("")).toContain('"type":"done"');
    expect(captured.ended).toBe(true);
  });

  it("fails open (200, still answers) when the session store throws", async () => {
    const boom: SessionStore = {
      checkRateLimit: async () => {
        throw new Error("dynamo down");
      },
      get: async () => null,
      appendMessage: async () => {
        throw new Error("dynamo down");
      },
      update: async () => null,
      listPending: async () => {
        throw new Error("dynamo down");
      },
    };
    await run(
      makeEvent({ messages: [{ role: "user", content: "hi" }] }),
      okRuntime({ sessions: boom }),
    );
    expect(captured.statusCode).toBe(200);
    expect(captured.writes.join("")).toBe("Hello world");
    expect(
      captured.headers?.["set-cookie"]?.startsWith(`${COOKIE_NAME}=`),
    ).toBe(true);
  });
});

describe("handleChatEvent book_meeting gating", () => {
  const SESSION = "bbbbbbbb-cccc-dddd-eeee-ffffffffffff";
  const framedHeaders = { accept: CHAT_FRAMES_ACCEPT };
  const framedCookies = [`${COOKIE_NAME}=${SESSION}`];

  it("does not pass tools when intent is researching", async () => {
    let tools: TokenArgs["tools"];
    const store = new MemorySessionStore();
    await run(
      makeEvent(
        { messages: [{ role: "user", content: "who is josh" }] },
        framedHeaders,
        framedCookies,
      ),
      okRuntime({
        sessions: store,
        calcomConfigured: true,
        classifyIntent: async () => "researching",
        tokens: async function* (args) {
          tools = args.tools;
          yield "Hi";
        },
      }),
    );
    expect(tools).toBeUndefined();
    expect(captured.writes.join("")).not.toContain("meeting_booking");
  });

  it("passes book_meeting when evaluating and Cal.com is configured", async () => {
    let tools: TokenArgs["tools"];
    const store = new MemorySessionStore();
    await run(
      makeEvent(
        { messages: [{ role: "user", content: "I need a RAG funnel built" }] },
        framedHeaders,
        framedCookies,
      ),
      okRuntime({
        sessions: store,
        calcomConfigured: true,
        classifyIntent: async () => "evaluating",
        bookingUrl: () => "https://cal.com/joshlowe/30min?notes=RAG",
        tokens: async function* (args) {
          tools = args.tools;
          yield "Let's talk. ";
          args.onToolUse?.({
            name: "book_meeting",
            input: { topicSummary: "RAG funnel", name: "Ada" },
          });
        },
      }),
    );
    expect(tools?.[0]?.toolSpec?.name).toBe("book_meeting");
    const body = captured.writes.join("");
    expect(body).toContain('"type":"meeting_booking"');
    expect(body).toContain("https://cal.com/joshlowe/30min?notes=RAG");
    expect(body).toContain(BOOKING_CTA);
    const idxBook = body.indexOf('"type":"meeting_booking"');
    const idxCite = body.indexOf('"type":"citations"');
    expect(idxBook).toBeGreaterThan(-1);
    expect(idxCite).toBeGreaterThan(idxBook);
    const row = store.snapshot(SESSION);
    expect(row?.qualified).toBe(true);
    expect(row?.bookingOffered).toBe(true);
    expect(row?.digestPk).toBe("PENDING");
    expect(row?.capturedName).toBe("Ada");
    expect(row?.topIntent).toBe("evaluating");
  });

  it("fails closed: evaluating but no Cal.com means no tools and no booking frame", async () => {
    let tools: TokenArgs["tools"];
    const store = new MemorySessionStore();
    await run(
      makeEvent(
        { messages: [{ role: "user", content: "hire me a twin" }] },
        framedHeaders,
        framedCookies,
      ),
      okRuntime({
        sessions: store,
        calcomConfigured: false,
        classifyIntent: async () => "evaluating",
        bookingUrl: () => "https://cal.com/should-not-run",
        tokens: async function* (args) {
          tools = args.tools;
          yield "Hi";
          args.onToolUse?.({
            name: "book_meeting",
            input: { topicSummary: "x" },
          });
        },
      }),
    );
    expect(tools).toBeUndefined();
    expect(captured.writes.join("")).not.toContain("meeting_booking");
    expect(store.snapshot(SESSION)?.bookingOffered).toBe(false);
    expect(store.snapshot(SESSION)?.qualified).toBe(true);
  });

  it("fails closed: tool fired but bookingUrl returns null — no frame", async () => {
    const store = new MemorySessionStore();
    await run(
      makeEvent(
        { messages: [{ role: "user", content: "hire" }] },
        framedHeaders,
        framedCookies,
      ),
      okRuntime({
        sessions: store,
        calcomConfigured: true,
        classifyIntent: async () => "evaluating",
        bookingUrl: () => null,
        tokens: async function* (args) {
          yield "Hi";
          args.onToolUse?.({
            name: "book_meeting",
            input: { topicSummary: "x" },
          });
        },
      }),
    );
    expect(captured.writes.join("")).not.toContain("meeting_booking");
    expect(store.snapshot(SESSION)?.bookingOffered).toBe(false);
  });

  it("does not re-expose the tool once bookingOffered is set", async () => {
    const store = new MemorySessionStore();
    await store.checkRateLimit(SESSION, { ipHash: "x", userAgent: "t" }, 1);
    await store.update(SESSION, { qualified: true, bookingOffered: true });
    let tools: TokenArgs["tools"];
    await run(
      makeEvent(
        { messages: [{ role: "user", content: "still evaluating" }] },
        framedHeaders,
        framedCookies,
      ),
      okRuntime({
        sessions: store,
        calcomConfigured: true,
        classifyIntent: async () => "evaluating",
        tokens: async function* (args) {
          tools = args.tools;
          yield "Hi";
        },
      }),
    );
    expect(tools).toBeUndefined();
  });
});

describe("handleChatEvent langfuse flush", () => {
  it("awaits trace.flush() after stream.end()", async () => {
    const events: string[] = [];
    const trace: TraceHandle = {
      ...NOOP_TRACE,
      span: () => ({
        end: () => {},
        fail: () => {},
      }),
      generation: () => ({
        end: () => {},
        fail: () => {},
        recordFirstToken: () => {},
        recordUsage: () => {},
      }),
      end: () => {
        events.push("trace.end");
      },
      flush: async () => {
        expect(captured.ended).toBe(true);
        events.push("flush");
      },
    };
    await run(
      makeEvent({ messages: [{ role: "user", content: "hi" }] }),
      okRuntime({ startTrace: async () => trace }),
    );
    expect(captured.ended).toBe(true);
    expect(events).toEqual(["trace.end", "flush"]);
  });
});
