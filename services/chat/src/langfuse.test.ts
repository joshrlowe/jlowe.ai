import { afterEach, describe, expect, it } from "vitest";

import { NOOP_TRACE, resetLangfuseClient, startTrace } from "./langfuse.js";

afterEach(() => {
  resetLangfuseClient();
  delete process.env.LANGFUSE_PUBLIC_KEY_PARAM;
  delete process.env.LANGFUSE_SECRET_KEY_PARAM;
});

describe("startTrace", () => {
  it("returns the no-op handle when SSM param names are unset", async () => {
    const trace = await startTrace({ name: "chat" });
    expect(trace.id).toBeNull();
    expect(trace.span("x")).toBe(NOOP_TRACE.span("x"));
    await expect(trace.flush()).resolves.toBeUndefined();
  });
});
