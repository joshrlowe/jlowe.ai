import { describe, expect, it } from "vitest";

import {
  highestPriorityIntent,
  parseIntentLabel,
  type Intent,
} from "./intent.js";

describe("parseIntentLabel", () => {
  it("accepts an exact label", () => {
    expect(parseIntentLabel("evaluating")).toBe("evaluating");
    expect(parseIntentLabel("RESEARCHING")).toBe("researching");
  });

  it("accepts a label embedded in model prose", () => {
    expect(parseIntentLabel("intent: evaluating\n")).toBe("evaluating");
  });

  it("fails open to researching on garbage", () => {
    expect(parseIntentLabel("")).toBe("researching");
    expect(parseIntentLabel("asdf")).toBe("researching");
    expect(parseIntentLabel("I think they are curious")).toBe("researching");
  });
});

describe("highestPriorityIntent", () => {
  it("promotes to evaluating and never demotes", () => {
    expect(highestPriorityIntent(null, "researching")).toBe("researching");
    expect(highestPriorityIntent("researching", "evaluating")).toBe(
      "evaluating",
    );
    expect(highestPriorityIntent("evaluating", "researching")).toBe(
      "evaluating",
    );
    expect(highestPriorityIntent("technical_question", "unrelated")).toBe(
      "technical_question",
    );
  });

  it("treats an unrecognized previous value as empty", () => {
    expect(highestPriorityIntent("nope", "technical_question")).toBe(
      "technical_question",
    );
  });

  it("ranks evaluating above every other Intent", () => {
    const others: Intent[] = ["unrelated", "researching", "technical_question"];
    for (const prev of others) {
      expect(highestPriorityIntent(prev, "evaluating")).toBe("evaluating");
    }
  });
});
