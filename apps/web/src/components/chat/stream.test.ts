import { afterEach, describe, expect, it, vi } from "vitest";

import { streamChat } from "./stream";

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

async function collect(gen: AsyncGenerator<string>): Promise<string[]> {
  const out: string[] = [];
  for await (const d of gen) out.push(d);
  return out;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("streamChat", () => {
  it("POSTs to /api/chat with JSON body and the abort signal", async () => {
    const fetchMock = vi.fn().mockResolvedValue(streamingResponse(["hi"]));
    vi.stubGlobal("fetch", fetchMock);

    const controller = new AbortController();
    const req = {
      messages: [{ role: "user" as const, content: "hello" }],
      context: { collectedBeacons: ["a"] },
    };
    await collect(streamChat(req, controller.signal));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("fetch was not called");
    const [url, options] = call;
    expect(url).toBe("/api/chat");
    expect(options.method).toBe("POST");
    expect(options.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(options.body)).toEqual(req);
    expect(options.signal).toBe(controller.signal);
  });

  it("yields each decoded text delta until the stream ends", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(streamingResponse(["Hello", ", ", "world"])),
    );

    const deltas = await collect(
      streamChat(
        { messages: [{ role: "user", content: "hi" }] },
        new AbortController().signal,
      ),
    );

    expect(deltas).toEqual(["Hello", ", ", "world"]);
    expect(deltas.join("")).toBe("Hello, world");
  });

  it("throws on a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 500 })),
    );

    await expect(
      collect(
        streamChat(
          { messages: [{ role: "user", content: "hi" }] },
          new AbortController().signal,
        ),
      ),
    ).rejects.toThrow(/500/);
  });

  it("throws when the response has no body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, body: null } as Response),
    );

    await expect(
      collect(
        streamChat(
          { messages: [{ role: "user", content: "hi" }] },
          new AbortController().signal,
        ),
      ),
    ).rejects.toThrow();
  });
});
