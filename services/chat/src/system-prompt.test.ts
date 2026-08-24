import { describe, expect, it } from "vitest";

import { SYSTEM_PROMPT } from "./system-prompt.js";

describe("SYSTEM_PROMPT", () => {
  it("is persona guardrails only — no project bodies", () => {
    expect(SYSTEM_PROMPT).toContain("digital twin");
    expect(SYSTEM_PROMPT).toContain("Answer **only** from the CONTEXT below");
    expect(SYSTEM_PROMPT).not.toContain("Jarvis is a self-hosted");
    expect(SYSTEM_PROMPT).not.toContain("# CONTEXT — Josh's corpus");
  });
});
