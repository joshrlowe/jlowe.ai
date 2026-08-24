/**
 * Langfuse observability wrapper. Ported from v1 `lib/observability/langfuse.ts`.
 *
 * Keys live in SSM SecureString parameters (names in
 * LANGFUSE_PUBLIC_KEY_PARAM / LANGFUSE_SECRET_KEY_PARAM). Missing, "unset",
 * or a fetch error → frozen no-op handles. Every SDK call is try/caught.
 *
 * **Lambda-critical:** callers MUST `await trace.flush()` after `stream.end()`.
 * The execution environment freezes the instant the handler returns, so v1's
 * fire-and-forget `void trace.flush()` would silently drop every trace here.
 */

import { GetParametersCommand, SSMClient } from "@aws-sdk/client-ssm";
import {
  Langfuse,
  type LangfuseGenerationClient,
  type LangfuseSpanClient,
  type LangfuseTraceClient,
} from "langfuse";

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
  span(
    name: string,
    input?: unknown,
    metadata?: Record<string, unknown>,
  ): SpanHandle;
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

export const NOOP_TRACE: TraceHandle = Object.freeze({
  id: null,
  span: () => NOOP_SPAN,
  generation: () => NOOP_GENERATION,
  end: () => {},
  flush: async () => {},
});

let ssm: SSMClient | undefined;
let cachedClient: Langfuse | null | undefined;

async function readParams(): Promise<{
  publicKey: string;
  secretKey: string;
  host: string;
} | null> {
  const publicName = process.env.LANGFUSE_PUBLIC_KEY_PARAM;
  const secretName = process.env.LANGFUSE_SECRET_KEY_PARAM;
  if (!publicName || !secretName) return null;
  ssm ??= new SSMClient({});
  const res = await ssm.send(
    new GetParametersCommand({
      Names: [publicName, secretName],
      WithDecryption: true,
    }),
  );
  const map = new Map(
    (res.Parameters ?? []).map((p) => [p.Name, p.Value] as const),
  );
  const publicKey = map.get(publicName);
  const secretKey = map.get(secretName);
  if (
    !publicKey ||
    !secretKey ||
    publicKey === "unset" ||
    secretKey === "unset"
  ) {
    return null;
  }
  return {
    publicKey,
    secretKey,
    host: process.env.LANGFUSE_HOST || "https://cloud.langfuse.com",
  };
}

async function getClient(): Promise<Langfuse | null> {
  if (cachedClient !== undefined) return cachedClient;
  cachedClient = null;
  try {
    const keys = await readParams();
    if (!keys) return null;
    cachedClient = new Langfuse({
      publicKey: keys.publicKey,
      secretKey: keys.secretKey,
      baseUrl: keys.host,
    });
  } catch (err) {
    console.warn("[langfuse] init failed:", (err as Error).message);
    cachedClient = null;
  }
  return cachedClient;
}

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
        span.end({ level: "ERROR", statusMessage: error.message });
      } catch (err) {
        console.warn("[langfuse] span.fail failed:", (err as Error).message);
      }
    },
  };
}

function wrapGeneration(
  generation: LangfuseGenerationClient,
): GenerationHandle {
  let firstTokenAt: number | null = null;
  const startedAt = Date.now();
  return {
    recordFirstToken() {
      if (firstTokenAt !== null) return;
      firstTokenAt = Date.now();
      try {
        generation.update({
          metadata: { timeToFirstTokenMs: firstTokenAt - startedAt },
        });
      } catch (err) {
        console.warn(
          "[langfuse] recordFirstToken failed:",
          (err as Error).message,
        );
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
        console.warn(
          "[langfuse] generation.end failed:",
          (err as Error).message,
        );
      }
    },
    fail(error) {
      try {
        generation.end({ level: "ERROR", statusMessage: error.message });
      } catch (err) {
        console.warn(
          "[langfuse] generation.fail failed:",
          (err as Error).message,
        );
      }
    },
  };
}

function wrapTrace(client: Langfuse, trace: LangfuseTraceClient): TraceHandle {
  return {
    id: trace.id,
    span(name, input, metadata) {
      try {
        return wrapSpan(
          trace.span({ name, input, metadata: metadata as never }),
        );
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
          }),
        );
      } catch (err) {
        console.warn(
          "[langfuse] trace.generation failed:",
          (err as Error).message,
        );
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

export async function startTrace(params: {
  name: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  input?: unknown;
}): Promise<TraceHandle> {
  const client = await getClient();
  if (!client) return NOOP_TRACE;
  try {
    const trace = client.trace({
      name: params.name,
      sessionId: params.sessionId,
      metadata: params.metadata,
      input: params.input,
    });
    return wrapTrace(client, trace);
  } catch (err) {
    console.warn("[langfuse] startTrace failed:", (err as Error).message);
    return NOOP_TRACE;
  }
}

/** Test-only: drop the cached client so a later startTrace re-reads env. */
export function resetLangfuseClient(): void {
  cachedClient = undefined;
}
