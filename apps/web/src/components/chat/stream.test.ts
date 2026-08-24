import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CHAT_FRAMES_ACCEPT,
  consumeFrames,
  flushFrameBuffer,
  parseChatFrame,
  streamChat,
  type ChatStreamEvent,
} from "./stream";

/** Build a Response whose body streams the given UTF-8 chunks in order. */
function streamingResponse(chunks: string[], init?: ResponseInit): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  return new Response(body, { status: 200, ...init });
}

function plainResponse(chunks: string[]): Response {
  return streamingResponse(chunks, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

function framedResponse(chunks: string[]): Response {
  return streamingResponse(chunks, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8" },
  });
}

function encodeFrame(event: ChatStreamEvent): string {
  return `${JSON.stringify(event)}\n\n`;
}

async function collect(
  gen: AsyncGenerator<ChatStreamEvent>,
): Promise<ChatStreamEvent[]> {
  const out: ChatStreamEvent[] = [];
  for await (const d of gen) out.push(d);
  return out;
}

/** Hex-encoded SHA-256 of a UTF-8 string — mirrors the client's payload hash. */
async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const req = { messages: [{ role: "user" as const, content: "hi" }] };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("parseChatFrame / consumeFrames", () => {
  it("parses each known frame type", () => {
    expect(parseChatFrame('{"type":"done"}')).toEqual({ type: "done" });
    expect(parseChatFrame('{"type":"text","content":"Hello"}')).toEqual({
      type: "text",
      content: "Hello",
    });
    expect(
      parseChatFrame(
        '{"type":"meeting_booking","url":"https://cal.com/x","message":"book"}',
      ),
    ).toEqual({
      type: "meeting_booking",
      url: "https://cal.com/x",
      message: "book",
    });
    expect(
      parseChatFrame(
        '{"type":"citations","items":[{"index":1,"title":"Jarvis","url":"/projects/jarvis/","snippet":"self-hosted"}]}',
      ),
    ).toEqual({
      type: "citations",
      items: [
        {
          index: 1,
          title: "Jarvis",
          url: "/projects/jarvis/",
          snippet: "self-hosted",
        },
      ],
    });
  });

  it("drops malformed JSON, unknown types, and booking frames with an empty url", () => {
    expect(parseChatFrame("not-json")).toBeNull();
    expect(parseChatFrame('{"type":"nope"}')).toBeNull();
    expect(
      parseChatFrame('{"type":"meeting_booking","url":"  ","message":"book"}'),
    ).toBeNull();
    expect(parseChatFrame('{"type":"text"}')).toBeNull();
  });

  it("holds a split frame in rest until the delimiter arrives", () => {
    const frame = encodeFrame({ type: "text", content: "Hello" });
    const mid = Math.floor(frame.length / 2);
    const first = consumeFrames(frame.slice(0, mid));
    expect(first.events).toEqual([]);
    expect(first.rest).toBe(frame.slice(0, mid));

    const second = consumeFrames(first.rest + frame.slice(mid));
    expect(second.events).toEqual([{ type: "text", content: "Hello" }]);
    expect(second.rest).toBe("");
  });

  it("drains several frames from one buffer and leaves an incomplete tail", () => {
    const { events, rest } = consumeFrames(
      encodeFrame({ type: "meta", chunkCount: 1, retrievalMs: 4 }) +
        encodeFrame({ type: "text", content: "Hi" }) +
        '{"type":"done"',
    );
    expect(events.map((e) => e.type)).toEqual(["meta", "text"]);
    expect(rest).toBe('{"type":"done"');
  });

  it("flushes a terminator-less tail at end of stream", () => {
    expect(flushFrameBuffer('{"type":"done"}')).toEqual([{ type: "done" }]);
  });
});

describe("streamChat", () => {
  it("POSTs to /api/chat with JSON body, frames Accept, payload-hash header, and the abort signal", async () => {
    const fetchMock = vi.fn().mockResolvedValue(plainResponse(["hi"]));
    vi.stubGlobal("fetch", fetchMock);

    const controller = new AbortController();
    const payload = {
      messages: [{ role: "user" as const, content: "hello" }],
      context: { collectedBeacons: ["a"] },
    };
    await collect(streamChat(payload, controller.signal));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("fetch was not called");
    const [url, options] = call as [
      string,
      {
        method: string;
        headers: Record<string, string>;
        body: string;
        signal: AbortSignal;
      },
    ];
    expect(url).toBe("/api/chat");
    expect(options.method).toBe("POST");
    expect(options.headers["content-type"]).toBe("application/json");
    expect(options.headers.accept).toBe(CHAT_FRAMES_ACCEPT);
    // OAC-for-Lambda contract: the viewer must send the body's payload hash so
    // CloudFront can fold it into the SigV4 signature it forwards to the
    // Function URL. The header must be the SHA-256 of the exact bytes sent.
    expect(options.headers["x-amz-content-sha256"]).toBe(
      await sha256Hex(options.body),
    );
    expect(JSON.parse(options.body)).toEqual(payload);
    expect(options.signal).toBe(controller.signal);
  });

  it("back-compat: text/plain bodies are raw deltas, not JSON frames", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(plainResponse(["Hello", ", ", "world"])),
    );

    const events = await collect(streamChat(req, new AbortController().signal));

    expect(events).toEqual([
      { type: "text", content: "Hello" },
      { type: "text", content: ", " },
      { type: "text", content: "world" },
    ]);
    expect(
      events
        .filter(
          (e): e is Extract<ChatStreamEvent, { type: "text" }> =>
            e.type === "text",
        )
        .map((e) => e.content)
        .join(""),
    ).toBe("Hello, world");
  });

  it("parses a frame split across TCP reads into one event", async () => {
    const frame = encodeFrame({ type: "text", content: "Hello" });
    const mid = Math.floor(frame.length / 2);
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          framedResponse([frame.slice(0, mid), frame.slice(mid)]),
        ),
    );

    const events = await collect(streamChat(req, new AbortController().signal));

    expect(events).toEqual([{ type: "text", content: "Hello" }]);
  });

  it("parses a delimiter split across chunks and a full success stream", async () => {
    const frames = [
      encodeFrame({ type: "meta", chunkCount: 1, retrievalMs: 4 }),
      encodeFrame({ type: "text", content: "Jarvis" }),
      encodeFrame({
        type: "meeting_booking",
        url: "https://cal.com/josh/30min",
        message: "Want to go deeper?",
      }),
      encodeFrame({
        type: "citations",
        items: [
          {
            index: 1,
            title: "Jarvis",
            url: "/projects/jarvis/",
            snippet: "self-hosted",
          },
        ],
      }),
      encodeFrame({ type: "done" }),
    ].join("");
    // Split inside the first text frame AND across a `\n\n` boundary so both
    // cases are covered in one trip through the reader.
    const textFrame = encodeFrame({ type: "text", content: "Jarvis" });
    const splitAt =
      frames.indexOf(textFrame) + Math.floor(textFrame.length / 2);

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          framedResponse([frames.slice(0, splitAt), frames.slice(splitAt)]),
        ),
    );

    const events = await collect(streamChat(req, new AbortController().signal));

    expect(events.map((e) => e.type)).toEqual([
      "meta",
      "text",
      "meeting_booking",
      "citations",
      "done",
    ]);
    expect(events[1]).toEqual({ type: "text", content: "Jarvis" });
    expect(events[2]).toEqual({
      type: "meeting_booking",
      url: "https://cal.com/josh/30min",
      message: "Want to go deeper?",
    });
    const cites = events[3];
    expect(cites?.type).toBe("citations");
    if (cites?.type !== "citations") throw new Error("expected citations");
    expect(cites.items[0]?.url).toBe("/projects/jarvis/");
  });

  it("skips a malformed frame and keeps parsing the rest of the stream", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          framedResponse([
            encodeFrame({ type: "text", content: "ok" }) +
              "not-json\n\n" +
              encodeFrame({ type: "done" }),
          ]),
        ),
    );

    const events = await collect(streamChat(req, new AbortController().signal));
    expect(events).toEqual([{ type: "text", content: "ok" }, { type: "done" }]);
  });

  it("throws on a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 500 })),
    );

    await expect(
      collect(streamChat(req, new AbortController().signal)),
    ).rejects.toThrow(/500/);
  });

  it("throws when the response has no body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, body: null } as Response),
    );

    await expect(
      collect(streamChat(req, new AbortController().signal)),
    ).rejects.toThrow();
  });
});
