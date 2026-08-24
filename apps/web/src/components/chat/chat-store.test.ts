import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ChatStreamEvent } from "./stream";

// Mock the transport so the store tests never touch fetch/network. Each test
// sets the generator's behavior via `streamImpl`.
let streamImpl: (...args: unknown[]) => AsyncGenerator<ChatStreamEvent> =
  async function* () {};

vi.mock("./stream", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./stream")>();
  return {
    ...actual,
    streamChat: (...args: unknown[]) => streamImpl(...args),
  };
});

import { chatStore, foldAssistantEvent } from "./chat-store";
import { chapterStore } from "@/components/world/state/chapter-store";

/** A generator that yields the given events. */
function fromEvents(events: ChatStreamEvent[]) {
  return async function* () {
    for (const event of events) yield event;
  };
}

function fromDeltas(deltas: string[]) {
  return fromEvents(
    deltas.map((content) => ({ type: "text" as const, content })),
  );
}

const jarvisCite = {
  index: 1,
  title: "Jarvis",
  url: "/projects/jarvis/",
  snippet: "self-hosted personal AI",
} as const;

beforeEach(() => {
  chatStore.getState().reset();
  streamImpl = async function* () {};
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("foldAssistantEvent", () => {
  const empty = { role: "assistant" as const, content: "" };

  it("concatenates text and attaches citations / booking without inventing a URL", () => {
    const withText = foldAssistantEvent(empty, {
      type: "text",
      content: "Hello",
    });
    expect(withText.content).toBe("Hello");

    const withCite = foldAssistantEvent(withText, {
      type: "citations",
      items: [jarvisCite],
    });
    expect(withCite.citations).toEqual([jarvisCite]);

    const withBook = foldAssistantEvent(withCite, {
      type: "meeting_booking",
      url: "https://cal.com/josh/30min",
      message: "Want to go deeper?",
    });
    expect(withBook.meetingBooking).toEqual({
      url: "https://cal.com/josh/30min",
      message: "Want to go deeper?",
    });
  });

  it("keeps partial text on error, otherwise uses the server message", () => {
    expect(
      foldAssistantEvent(empty, { type: "error", message: "snag" }).content,
    ).toBe("snag");
    expect(
      foldAssistantEvent(
        { role: "assistant", content: "partial" },
        { type: "error", message: "snag" },
      ).content,
    ).toBe("partial");
  });
});

describe("chatStore", () => {
  it("toggles and closes the dock", () => {
    expect(chatStore.getState().open).toBe(false);
    chatStore.getState().toggle();
    expect(chatStore.getState().open).toBe(true);
    chatStore.getState().close();
    expect(chatStore.getState().open).toBe(false);
  });

  it("send appends the user message and a streamed assistant reply", async () => {
    streamImpl = fromDeltas(["Hel", "lo!"]);
    chatStore.getState().setInput("hi there");

    await chatStore.getState().send();

    const { messages, status, input } = chatStore.getState();
    expect(messages).toHaveLength(2);
    expect(messages[0]).toEqual({ role: "user", content: "hi there" });
    expect(messages[1]).toEqual({ role: "assistant", content: "Hello!" });
    expect(status).toBe("idle");
    // Input is cleared once the turn is sent.
    expect(input).toBe("");
  });

  it("attaches citations and a meeting_booking frame to the assistant turn", async () => {
    streamImpl = fromEvents([
      { type: "meta", chunkCount: 1, retrievalMs: 4 },
      { type: "text", content: "Jarvis is a self-hosted assistant." },
      {
        type: "meeting_booking",
        url: "https://cal.com/josh/30min",
        message: "Want to go deeper?",
      },
      { type: "citations", items: [jarvisCite] },
      { type: "done" },
    ]);
    chatStore.getState().setInput("tell me about jarvis");

    await chatStore.getState().send();

    const reply = chatStore.getState().messages[1];
    expect(reply?.role).toBe("assistant");
    expect(reply?.content).toBe("Jarvis is a self-hosted assistant.");
    expect(reply?.citations).toEqual([jarvisCite]);
    expect(reply?.meetingBooking).toEqual({
      url: "https://cal.com/josh/30min",
      message: "Want to go deeper?",
    });
    expect(chatStore.getState().status).toBe("idle");
  });

  it("sets error status from an error frame and keeps any partial text", async () => {
    streamImpl = fromEvents([
      { type: "text", content: "partial" },
      { type: "error", message: "Sorry — I hit a snag answering that." },
      { type: "done" },
    ]);
    chatStore.getState().setInput("hi");

    await chatStore.getState().send();

    const { messages, status } = chatStore.getState();
    expect(status).toBe("error");
    expect(messages[1]?.content).toBe("partial");
  });

  it("ignores empty/whitespace submits", async () => {
    chatStore.getState().setInput("   ");
    await chatStore.getState().send();
    expect(chatStore.getState().messages).toHaveLength(0);
  });

  it("sends only prior turns (not the empty placeholder) to the backend", async () => {
    const sent: unknown[] = [];
    streamImpl = async function* (...args: unknown[]) {
      sent.push(args[0]);
      yield { type: "text", content: "ok" };
    };
    chatStore.getState().setInput("first question");

    await chatStore.getState().send();

    expect(sent).toHaveLength(1);
    const payload = sent[0] as { messages: unknown[] };
    // The placeholder assistant message must be excluded from the request.
    expect(payload.messages).toEqual([
      { role: "user", content: "first question" },
    ]);
  });

  it("strips citations and booking off prior turns before POSTing", async () => {
    streamImpl = fromEvents([
      { type: "text", content: "first" },
      { type: "citations", items: [jarvisCite] },
      {
        type: "meeting_booking",
        url: "https://cal.com/josh/30min",
        message: "book",
      },
    ]);
    chatStore.getState().setInput("first");
    await chatStore.getState().send();

    const sent: unknown[] = [];
    streamImpl = async function* (...args: unknown[]) {
      sent.push(args[0]);
      yield { type: "text", content: "second" };
    };
    chatStore.getState().setInput("follow up");
    await chatStore.getState().send();

    const payload = sent[0] as { messages: unknown[] };
    expect(payload.messages).toEqual([
      { role: "user", content: "first" },
      { role: "assistant", content: "first" },
      { role: "user", content: "follow up" },
    ]);
  });

  it("includes collectedBeacons from the chapter store as grounding context", async () => {
    chapterStore.getState().collectBeacon("genesis");
    const sent: unknown[] = [];
    streamImpl = async function* (...args: unknown[]) {
      sent.push(args[0]);
      yield { type: "text", content: "ok" };
    };
    chatStore.getState().setInput("what have I found?");

    await chatStore.getState().send();

    const payload = sent[0] as { context?: { collectedBeacons: string[] } };
    expect(payload.context?.collectedBeacons).toContain("genesis");
  });

  it("sets an error status and a fallback line when the stream throws", async () => {
    streamImpl = async function* () {
      throw new Error("boom");
    };
    chatStore.getState().setInput("hi");

    await chatStore.getState().send();

    const { messages, status } = chatStore.getState();
    expect(status).toBe("error");
    expect(messages).toHaveLength(2);
    const reply = messages[1];
    expect(reply?.role).toBe("assistant");
    expect(reply?.content.length ?? 0).toBeGreaterThan(0);
  });

  it("reset clears messages, input, and status", async () => {
    streamImpl = fromDeltas(["hello"]);
    chatStore.getState().setInput("hi");
    await chatStore.getState().send();
    expect(chatStore.getState().messages.length).toBeGreaterThan(0);

    chatStore.getState().setInput("draft");
    chatStore.getState().reset();

    const { messages, input, status } = chatStore.getState();
    expect(messages).toHaveLength(0);
    expect(input).toBe("");
    expect(status).toBe("idle");
  });
});
