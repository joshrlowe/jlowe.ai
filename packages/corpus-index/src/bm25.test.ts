import { describe, expect, it } from "vitest";

import {
  bm25Rank,
  bm25Score,
  buildBm25Stats,
  termFrequencies,
  tokenize,
} from "./bm25.js";

function doc(text: string) {
  const tokens = tokenize(text);
  return { termFreqs: termFrequencies(tokens), docLength: tokens.length };
}

describe("tokenize", () => {
  it("lowercases and drops single-character tokens", () => {
    expect(tokenize("Jarvis is a Self-hosted AI.")).toEqual([
      "jarvis",
      "is",
      "self",
      "hosted",
      "ai",
    ]);
  });
});

describe("bm25", () => {
  const jarvis = {
    id: "jarvis",
    ...doc("jarvis self hosted assistant memory"),
  };
  const mail = { id: "mail", ...doc("mailsweep email cleanup inbox") };
  const stats = buildBm25Stats([jarvis, mail]);

  it("ranks the document that contains the query term first", () => {
    const hits = bm25Rank("jarvis memory", [jarvis, mail], stats, 20);
    expect(hits[0]?.id).toBe("jarvis");
    expect(hits[0]?.score).toBeGreaterThan(0);
  });

  it("returns [] for an empty query", () => {
    expect(bm25Rank("   ", [jarvis, mail], stats, 20)).toEqual([]);
  });

  it("ignores terms that never occur", () => {
    expect(bm25Rank("xyzzy", [jarvis, mail], stats, 20)).toEqual([]);
  });

  it("is zero when the document has none of the query terms", () => {
    expect(
      bm25Score(tokenize("jarvis"), mail.termFreqs, mail.docLength, stats),
    ).toBe(0);
  });

  it("respects topN", () => {
    const hits = bm25Rank("email assistant", [jarvis, mail], stats, 1);
    expect(hits).toHaveLength(1);
  });
});
