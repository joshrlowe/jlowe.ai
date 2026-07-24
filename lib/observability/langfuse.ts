/**
 * Langfuse observability wrapper.
 *
 * Lazy-imports the SDK and returns frozen no-op handles when the
 * LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY env vars are missing.
 *
 * Mirrors the fail-open pattern of lib/utils/rateLimit.ts.
 */

import type {
  Langfuse,
  LangfuseTraceClient,
  LangfuseSpanClient,
  LangfuseGenerationClient,
} from "langfuse";

let _client: Langfuse | null = null;
let _initialized = false;

async function getClient(): Promise<Langfuse | null> {
  if (_initialized) return _client;
  _initialized = true;
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) {
    return null;
  }
  try {
    const mod = await import("langfuse");
    const Ctor = mod.Langfuse ?? mod.default;
    _client = new Ctor({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_HOST || "https://cloud.langfuse.com",
    });
  } catch (err) {
    console.warn("[langfuse] init failed:", (err as Error).message);
  }
  return _client;
}

export interface SpanHandle {
  end(output?: unknown, metadata?: Record<string, unknown>): void;
  fail(error: Error): void;
}

export interface GenerationHandle extends SpanHandle {
  recordFirstToken(): void;
  recordUsage(usage: { input?: number; output?: number; total?: number }): void;
}

export interface TraceHandle {
  id: string | null;
  span(name: string, input?: unknown, metadata?: Record<string, unknown>): SpanHandle;
  generation(params: {
    name: string;
    model: string;
    input: unknown;
    modelParameters?: Record<string, unknown>;
  }): GenerationHandle;
  end(output?: unknown, metadata?: Record<string, unknown>): void;
  flush(): Promise<void>;
}

const NOOP_SPAN: SpanHandle = Object.freeze({
  end: () => {},
  fail: () => {},
});

const NOOP_GENERATION: GenerationHandle = Object.freeze({
  end: () => {},
  fail: () => {},
  recordFirstToken: () => {},
  recordUsage: () => {},
});

const NOOP_TRACE: TraceHandle = Object.freeze({
  id: null,
  span: () => NOOP_SPAN,
  generation: () => NOOP_GENERATION,
  end: () => {},
  flush: async () => {},
});

function wrapSpan(span: LangfuseSpanClient): SpanHandle {
  return {
    end(output, metadata) {
      try {
        span.end({ output, metadata: metadata as never });
      } catch (err) {
        console.warn("[langfuse] span.end failed:", (err as Error).message);
      }
    },
    fail(error) {
      try {
        span.end({
          level: "ERROR",
          statusMessage: error.message,
        });
      } catch (err) {
        console.warn("[langfuse] span.fail failed:", (err as Error).message);
      }
    },
  };
}

function wrapGeneration(generation: LangfuseGenerationClient): GenerationHandle {
  let firstTokenAt: number | null = null;
  const startedAt = Date.now();

  return {
    recordFirstToken() {
      if (firstTokenAt === null) {
        firstTokenAt = Date.now();
        try {
          generation.update({
            metadata: { timeToFirstTokenMs: firstTokenAt - startedAt },
          });
        } catch (err) {
          console.warn("[langfuse] recordFirstToken failed:", (err as Error).message);
        }
      }
    },
    recordUsage(usage) {
      try {
        generation.update({
          usage: {
            input: usage.input,
            output: usage.output,
            total: usage.total,
          },
        });
      } catch (err) {
        console.warn("[langfuse] recordUsage failed:", (err as Error).message);
      }
    },
    end(output, metadata) {
      try {
        generation.end({ output, metadata: metadata as never });
      } catch (err) {
        console.warn("[langfuse] generation.end failed:", (err as Error).message);
      }
    },
    fail(error) {
      try {
        generation.end({
          level: "ERROR",
          statusMessage: error.message,
        });
      } catch (err) {
        console.warn("[langfuse] generation.fail failed:", (err as Error).message);
      }
    },
  };
}

function wrapTrace(client: Langfuse, trace: LangfuseTraceClient): TraceHandle {
  return {
    id: trace.id,
    span(name, input, metadata) {
      try {
        return wrapSpan(trace.span({ name, input, metadata: metadata as never }));
      } catch (err) {
        console.warn("[langfuse] trace.span failed:", (err as Error).message);
        return NOOP_SPAN;
      }
    },
    generation(params) {
      try {
        return wrapGeneration(
          trace.generation({
            name: params.name,
            model: params.model,
            input: params.input,
            modelParameters: params.modelParameters as never,
          })
        );
      } catch (err) {
        console.warn("[langfuse] trace.generation failed:", (err as Error).message);
        return NOOP_GENERATION;
      }
    },
    end(output, metadata) {
      try {
        trace.update({ output, metadata: metadata as never });
      } catch (err) {
        console.warn("[langfuse] trace.end failed:", (err as Error).message);
      }
    },
    async flush() {
      try {
        await client.flushAsync();
      } catch (err) {
        console.warn("[langfuse] flush failed:", (err as Error).message);
      }
    },
  };
}

/**
 * Start a Langfuse trace. Returns a frozen no-op handle when unconfigured.
 */
export async function startTrace(params: {
  name: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  input?: unknown;
}): Promise<TraceHandle> {
  const client = await getClient();
  if (!client) return NOOP_TRACE;
  try {
    const trace = client.trace({
      name: params.name,
      sessionId: params.sessionId,
      userId: params.userId,
      metadata: params.metadata,
      input: params.input,
    });
    return wrapTrace(client, trace);
  } catch (err) {
    console.warn("[langfuse] startTrace failed:", (err as Error).message);
    return NOOP_TRACE;
  }
}

/**
 * Attach a score to an existing trace. Returns true if the score was sent,
 * false when the SDK is unconfigured or upload failed.
 */
export async function scoreTrace(params: {
  traceId: string;
  name: string;
  value: number;
  comment?: string;
}): Promise<boolean> {
  const client = await getClient();
  if (!client) return false;
  try {
    client.score({
      traceId: params.traceId,
      name: params.name,
      value: params.value,
      comment: params.comment,
    });
    await client.flushAsync();
    return true;
  } catch (err) {
    console.warn("[langfuse] scoreTrace failed:", (err as Error).message);
    return false;
  }
}
