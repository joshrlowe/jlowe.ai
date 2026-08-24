import { describe, expect, it } from "vitest";

import {
  IDLE,
  parseToolInput,
  reduceStreamItem,
  type AssemblerState,
} from "./tool-assembler.js";

function fold(items: Parameters<typeof reduceStreamItem>[1][]): {
  texts: string[];
  calls: { name: string; input: Record<string, unknown> }[];
  state: AssemblerState;
} {
  let state: AssemblerState = IDLE;
  const texts: string[] = [];
  const calls: { name: string; input: Record<string, unknown> }[] = [];
  for (const item of items) {
    const out = reduceStreamItem(state, item);
    state = out.state;
    if (out.text) texts.push(out.text);
    if (out.toolCall) calls.push(out.toolCall);
  }
  return { texts, calls, state };
}

describe("parseToolInput", () => {
  it("parses an object and returns {} for an empty buffer", () => {
    expect(parseToolInput("")).toEqual({});
    expect(parseToolInput('{"topicSummary":"x"}')).toEqual({
      topicSummary: "x",
    });
  });

  it("returns null for truncated or non-object JSON", () => {
    expect(parseToolInput('{"topic')).toBeNull();
    expect(parseToolInput("[1]")).toBeNull();
    expect(parseToolInput('"just a string"')).toBeNull();
  });
});

describe("reduceStreamItem", () => {
  it("assembles a tool input split across contentBlockDelta chunks", () => {
    const { texts, calls, state } = fold([
      {
        contentBlockDelta: { delta: { text: "I'd love to talk about this. " } },
      },
      { contentBlockStart: { start: { toolUse: { name: "book_meeting" } } } },
      { contentBlockDelta: { delta: { toolUse: { input: '{"topic' } } } },
      {
        contentBlockDelta: {
          delta: { toolUse: { input: 'Summary":"hire josh for RAG"}' } },
        },
      },
      { contentBlockStop: {} },
    ]);
    expect(texts).toEqual(["I'd love to talk about this. "]);
    expect(calls).toEqual([
      {
        name: "book_meeting",
        input: { topicSummary: "hire josh for RAG" },
      },
    ]);
    expect(state).toEqual(IDLE);
  });

  it("fails closed (no toolCall) when the assembled JSON never parses", () => {
    const { calls, state } = fold([
      { contentBlockStart: { start: { toolUse: { name: "book_meeting" } } } },
      { contentBlockDelta: { delta: { toolUse: { input: '{"topic' } } } },
      { contentBlockStop: {} },
    ]);
    expect(calls).toEqual([]);
    expect(state).toEqual(IDLE);
  });

  it("ignores tool_delta fragments that arrive before tool_start", () => {
    const { calls, state } = fold([
      { contentBlockDelta: { delta: { toolUse: { input: '{"x":1}' } } } },
      { contentBlockStop: {} },
    ]);
    expect(calls).toEqual([]);
    expect(state).toEqual(IDLE);
  });
});
