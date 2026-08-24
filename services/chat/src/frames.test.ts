import { describe, expect, it } from "vitest";

import type { CitationItem } from "./citations.js";
import {
  CHAT_FRAMES_ACCEPT,
  closingFrames,
  encodeFrame,
  wantsFrames,
} from "./frames.js";

const cite: CitationItem = {
  index: 1,
  title: "Jarvis",
  url: "/projects/jarvis/",
  snippet: "self-hosted",
};

describe("encodeFrame", () => {
  it("serializes a JSON object terminated by a blank line", () => {
    expect(encodeFrame({ type: "done" })).toBe('{"type":"done"}\n\n');
    expect(encodeFrame({ type: "text", content: "Hello" })).toBe(
      '{"type":"text","content":"Hello"}\n\n',
    );
    expect(
      encodeFrame({
        type: "meeting_booking",
        url: "https://cal.com/x",
        message: "book",
      }),
    ).toBe(
      '{"type":"meeting_booking","url":"https://cal.com/x","message":"book"}\n\n',
    );
  });
});

describe("closingFrames", () => {
  it("emits citations then done on success", () => {
    expect(closingFrames(undefined, [cite]).map((f) => f.type)).toEqual([
      "citations",
      "done",
    ]);
  });

  it("emits error then done, never citations, on failure", () => {
    const frames = closingFrames("snag", [cite]);
    expect(frames.map((f) => f.type)).toEqual(["error", "done"]);
    expect(frames.some((f) => f.type === "citations")).toBe(false);
  });

  it("orders a full success stream meta → text* → citations → done", () => {
    const frames = [
      { type: "meta" as const, chunkCount: 1, retrievalMs: 4 },
      { type: "text" as const, content: "Hi" },
      ...closingFrames(undefined, [cite]),
    ];
    expect(frames.map((f) => f.type)).toEqual([
      "meta",
      "text",
      "citations",
      "done",
    ]);
  });

  it("orders a mid-stream failure meta → text* → error → done", () => {
    const frames = [
      { type: "meta" as const, chunkCount: 1, retrievalMs: 4 },
      { type: "text" as const, content: "Hi" },
      ...closingFrames("snag", [cite]),
    ];
    expect(frames.map((f) => f.type)).toEqual([
      "meta",
      "text",
      "error",
      "done",
    ]);
  });
});

describe("wantsFrames", () => {
  it("is true for the frames Accept type or text/event-stream", () => {
    expect(wantsFrames(CHAT_FRAMES_ACCEPT)).toBe(true);
    expect(wantsFrames("text/html, application/x-jlowe-chat-frames")).toBe(
      true,
    );
    expect(wantsFrames("text/event-stream")).toBe(true);
    expect(wantsFrames("TEXT/EVENT-STREAM")).toBe(true);
  });

  it("is false for missing or unrelated Accept", () => {
    expect(wantsFrames(undefined)).toBe(false);
    expect(wantsFrames("")).toBe(false);
    expect(wantsFrames("text/plain")).toBe(false);
    expect(wantsFrames("application/json")).toBe(false);
  });
});
