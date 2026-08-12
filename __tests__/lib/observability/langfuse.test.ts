/**
 * Tests for lib/observability/langfuse.ts — the lazy fail-open wrapper.
 *
 * The `langfuse` SDK import resolves to __mocks__/langfuse.js via
 * moduleNameMapper. The wrapper memoizes its client at module scope, so each
 * scenario uses jest.resetModules() + fresh dynamic imports (same pattern as
 * __tests__/api/chat/feedback.test.ts).
 */

type LangfuseWrapper = typeof import("@/lib/observability/langfuse");
type LangfuseMock = typeof import("../../../__mocks__/langfuse") & {
  __getCalls(): { kind: string; [k: string]: unknown }[];
  __resetCalls(): void;
};

async function freshImport(env: {
  publicKey?: string;
  secretKey?: string;
}): Promise<{ wrapper: LangfuseWrapper; mock: LangfuseMock }> {
  jest.resetModules();
  process.env.LANGFUSE_PUBLIC_KEY = env.publicKey ?? "";
  process.env.LANGFUSE_SECRET_KEY = env.secretKey ?? "";
  const wrapper = (await import("@/lib/observability/langfuse")) as LangfuseWrapper;
  const mock = (await import("../../../__mocks__/langfuse")) as unknown as LangfuseMock;
  mock.__resetCalls();
  return { wrapper, mock };
}

const ORIGINAL_ENV = { ...process.env };

afterAll(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("startTrace", () => {
  it("returns the frozen no-op trace when unconfigured", async () => {
    const { wrapper, mock } = await freshImport({});
    const trace = await wrapper.startTrace({ name: "chat" });

    expect(trace.id).toBeNull();
    // Exercising the no-op surface must not throw or record anything.
    const span = trace.span("s");
    span.end("out");
    span.fail(new Error("x"));
    const gen = trace.generation({ name: "g", model: "m", input: {} });
    gen.recordFirstToken();
    gen.recordUsage({ input: 1 });
    gen.end();
    trace.end();
    await trace.flush();
    expect(mock.__getCalls()).toHaveLength(0);
  });

  it("creates a real trace and records spans, generations, usage, and flush", async () => {
    const { wrapper, mock } = await freshImport({ publicKey: "pk", secretKey: "sk" });
    const trace = await wrapper.startTrace({
      name: "chat",
      sessionId: "sess-1",
      metadata: { a: 1 },
      input: { q: "hi" },
    });

    expect(trace.id).toBe("trace-1");

    const span = trace.span("retrieval", { q: "hi" });
    span.end({ hits: 3 });

    const gen = trace.generation({ name: "answer", model: "claude", input: [] });
    gen.recordFirstToken();
    gen.recordFirstToken(); // second call is a no-op (already recorded)
    gen.recordUsage({ input: 10, output: 20 });
    gen.end("final");
    trace.end({ ok: true });
    await trace.flush();

    const kinds = mock.__getCalls().map((c) => c.kind);
    expect(kinds).toEqual(
      expect.arrayContaining([
        "init",
        "trace",
        "trace.span",
        "span.end",
        "trace.generation",
        "generation.update",
        "generation.end",
        "trace.update",
        "flushAsync",
      ])
    );
    // recordFirstToken twice → exactly one metadata update + one usage update
    const updates = mock.__getCalls().filter((c) => c.kind === "generation.update");
    expect(updates).toHaveLength(2);
  });

  it("span.fail and generation.fail record error ends", async () => {
    const { wrapper, mock } = await freshImport({ publicKey: "pk", secretKey: "sk" });
    const trace = await wrapper.startTrace({ name: "chat" });

    trace.span("s").fail(new Error("boom"));
    trace.generation({ name: "g", model: "m", input: {} }).fail(new Error("bang"));

    const ends = mock
      .__getCalls()
      .filter((c) => c.kind === "span.end" || c.kind === "generation.end")
      .map((c) => c.body as { level?: string; statusMessage?: string });
    expect(ends).toEqual([
      expect.objectContaining({ level: "ERROR", statusMessage: "boom" }),
      expect.objectContaining({ level: "ERROR", statusMessage: "bang" }),
    ]);
  });

  it("memoizes the client across calls", async () => {
    const { wrapper, mock } = await freshImport({ publicKey: "pk", secretKey: "sk" });
    await wrapper.startTrace({ name: "one" });
    await wrapper.startTrace({ name: "two" });
    const inits = mock.__getCalls().filter((c) => c.kind === "init");
    expect(inits).toHaveLength(1);
  });
});

describe("scoreTrace", () => {
  it("returns false when unconfigured", async () => {
    const { wrapper, mock } = await freshImport({});
    await expect(
      wrapper.scoreTrace({ traceId: "t", name: "user_feedback", value: 1 })
    ).resolves.toBe(false);
    expect(mock.__getCalls()).toHaveLength(0);
  });

  it("scores and flushes when configured", async () => {
    const { wrapper, mock } = await freshImport({ publicKey: "pk", secretKey: "sk" });
    await expect(
      wrapper.scoreTrace({ traceId: "t-9", name: "user_feedback", value: -1, comment: "bad" })
    ).resolves.toBe(true);

    const score = mock.__getCalls().find((c) => c.kind === "score");
    expect(score?.body).toEqual({
      traceId: "t-9",
      name: "user_feedback",
      value: -1,
      comment: "bad",
    });
    expect(mock.__getCalls().some((c) => c.kind === "flushAsync")).toBe(true);
  });
});
