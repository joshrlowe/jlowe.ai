import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the transport so the store tests never touch fetch/network. Each test
// sets the generator's behavior via `streamImpl`.
let streamImpl: (...args: unknown[]) => AsyncGenerator<string> =
  async function* () {};

vi.mock("./stream", () => ({
  streamChat: (...args: unknown[]) => streamImpl(...args),
}));

import { chatStore } from "./chat-store";
import { chapterStore } from "@/components/world/state/chapter-store";

/** A generator that yields the given deltas. */
function fromDeltas(deltas: string[]) {
  return async function* () {
    for (const d of deltas) yield d;
  };
}

beforeEach(() => {
  chatStore.getState().reset();
  streamImpl = async function* () {};
});

afterEach(() => {
  vi.restoreAllMocks();
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

  it("ignores empty/whitespace submits", async () => {
    chatStore.getState().setInput("   ");
    await chatStore.getState().send();
    expect(chatStore.getState().messages).toHaveLength(0);
  });

  it("sends only prior turns (not the empty placeholder) to the backend", async () => {
    const sent: unknown[] = [];
    streamImpl = async function* (...args: unknown[]) {
      sent.push(args[0]);
      yield "ok";
    };
    chatStore.getState().setInput("first question");

    await chatStore.getState().send();

    expect(sent).toHaveLength(1);
    const req = sent[0] as { messages: unknown[] };
    // The placeholder assistant message must be excluded from the request.
    expect(req.messages).toEqual([{ role: "user", content: "first question" }]);
  });

  it("includes collectedBeacons from the chapter store as grounding context", async () => {
    chapterStore.getState().collectBeacon("genesis");
    const sent: unknown[] = [];
    streamImpl = async function* (...args: unknown[]) {
      sent.push(args[0]);
      yield "ok";
    };
    chatStore.getState().setInput("what have I found?");

    await chatStore.getState().send();

    const req = sent[0] as { context?: { collectedBeacons: string[] } };
    expect(req.context?.collectedBeacons).toContain("genesis");
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
