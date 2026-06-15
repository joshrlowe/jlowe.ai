import { describe, expect, it } from "vitest";

import {
  beaconContext,
  buildConverseMessages,
  parseChatRequest,
} from "./messages.js";

describe("parseChatRequest", () => {
  it("accepts a valid conversation", () => {
    const req = parseChatRequest(
      JSON.stringify({ messages: [{ role: "user", content: "hi" }] }),
    );
    expect(req.messages).toHaveLength(1);
  });

  it("rejects empty / over-long / unknown-role / malformed input", () => {
    expect(() => parseChatRequest(JSON.stringify({ messages: [] }))).toThrow();
    expect(() =>
      parseChatRequest(
        JSON.stringify({
          messages: [{ role: "user", content: "x".repeat(5000) }],
        }),
      ),
    ).toThrow();
    expect(() =>
      parseChatRequest(
        JSON.stringify({ messages: [{ role: "system", content: "x" }] }),
      ),
    ).toThrow();
    expect(() => parseChatRequest("{not json")).toThrow();
  });
});

describe("buildConverseMessages", () => {
  it("maps turns to the Converse content shape", () => {
    expect(buildConverseMessages([{ role: "user", content: "hello" }])).toEqual(
      [{ role: "user", content: [{ text: "hello" }] }],
    );
  });
});

describe("beaconContext", () => {
  it("is empty without collected beacons", () => {
    expect(beaconContext(undefined)).toBe("");
    expect(beaconContext({ collectedBeacons: [] })).toBe("");
  });

  it("lists collected beacons as a grounding hint", () => {
    expect(beaconContext({ collectedBeacons: ["rag", "velocity"] })).toContain(
      "rag, velocity",
    );
  });
});
