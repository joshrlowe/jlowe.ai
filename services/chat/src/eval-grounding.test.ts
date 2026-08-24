import { describe, expect, it } from "vitest";

import { closingFrames } from "./frames.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";
import { shouldExposeBookingTool } from "./tools.js";
import {
  assertGroundedPrompt,
  citationIndicesAreDense,
  UNGUARDED_PROMPT,
} from "./eval-grounding.js";

describe("tier 2 — grounded prompt has teeth", () => {
  it("the shipped SYSTEM_PROMPT contains the grounding rules", () => {
    expect(() => assertGroundedPrompt(SYSTEM_PROMPT)).not.toThrow();
  });

  it("a deliberately de-guardrailed prompt fails the suite", () => {
    expect(() => assertGroundedPrompt(UNGUARDED_PROMPT)).toThrow(
      /not grounded/,
    );
  });
});

describe("tier 2 — frame ordering and citation integrity", () => {
  it("closingFrames is citations then done, never both citations and error", () => {
    const ok = closingFrames(undefined, [
      { index: 1, title: "Jarvis", url: "/projects/jarvis/", snippet: "x" },
    ]);
    expect(ok.map((f) => f.type)).toEqual(["citations", "done"]);
    const err = closingFrames("snag", [
      { index: 1, title: "Jarvis", url: "/projects/jarvis/", snippet: "x" },
    ]);
    expect(err.map((f) => f.type)).toEqual(["error", "done"]);
  });

  it("citation indices are 1-based and dense", () => {
    expect(citationIndicesAreDense([1, 2, 3])).toBe(true);
    expect(citationIndicesAreDense([1, 3])).toBe(false);
    expect(citationIndicesAreDense([0, 1])).toBe(false);
  });
});

describe("tier 2 — tool gating", () => {
  it("does not expose book_meeting without Cal.com or evaluating intent", () => {
    expect(
      shouldExposeBookingTool({
        qualified: false,
        bookingOffered: false,
        intent: "researching",
        calcomConfigured: true,
      }),
    ).toBe(false);
    expect(
      shouldExposeBookingTool({
        qualified: false,
        bookingOffered: false,
        intent: "evaluating",
        calcomConfigured: false,
      }),
    ).toBe(false);
  });
});
