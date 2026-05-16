/**
 * Inngest function: regenerate KnowledgeChunk embeddings in response to
 * content changes.
 *
 * One function instance per source — concurrency is capped so the Bedrock
 * Titan rate limit isn't exceeded. Per-source operations are idempotent
 * (hash-gated), so retries are safe.
 *
 * Fan-out: a `knowledge/reindex.requested` event with no scope enumerates
 * every source and emits one scoped event per source, letting Inngest run
 * them in parallel within the concurrency budget instead of one long
 * sequential pass.
 */

import type { GetStepTools } from "inngest";
import prisma from "@/lib/prisma";
import { startTrace, type TraceHandle } from "@/lib/observability/langfuse";
import {
  deleteSourceChunks,
  loadOneSource,
  sweepSingletonChunks,
  upsertSourceChunks,
  type UpsertResult,
} from "@/lib/rag/upsert";
import { inngest } from "./client";
import type { Events } from "./events";

type Step = GetStepTools<typeof inngest>;

export type StepResult =
  | { kind: "deleted"; deleted: number }
  | { kind: "skipped"; reason: string }
  | ({ kind: "upserted" } & UpsertResult)
  | { kind: "fanout"; emitted: number };

interface HandlerContext {
  event: { name: string; data: Record<string, unknown> };
  step: Step;
}

/**
 * Handler logic exported separately so unit tests can call it with a fake
 * step object — the wrapped `regenerateEmbeddings` is not directly callable.
 */
export async function regenerateEmbeddingsHandler(
  ctx: HandlerContext,
): Promise<StepResult> {
  const { event, step } = ctx;
  const trace = await startTrace({
    name: "regenerate-embeddings",
    metadata: {
      eventName: event.name,
      eventData: event.data,
    },
  });

  try {
    switch (event.name) {
      case "content/post.deleted": {
        const { postId } = event.data as Events["content/post.deleted"]["data"];
        const span = trace.span("delete-article-chunks", { postId });
        const result = await step.run("delete-article-chunks", () =>
          deleteSourceChunks("article", postId),
        );
        span.end(result);
        return { kind: "deleted", deleted: result.deleted };
      }

      case "content/project.deleted": {
        const { projectId } =
          event.data as Events["content/project.deleted"]["data"];
        const span = trace.span("delete-project-chunks", { projectId });
        const result = await step.run("delete-project-chunks", () =>
          deleteSourceChunks("project", projectId),
        );
        span.end(result);
        return { kind: "deleted", deleted: result.deleted };
      }

      case "content/post.published":
      case "content/post.updated": {
        const { postId } =
          event.data as Events["content/post.updated"]["data"];
        return await handleScopedSource(trace, step, "article", postId);
      }

      case "content/project.upserted": {
        const { projectId } =
          event.data as Events["content/project.upserted"]["data"];
        return await handleScopedSource(trace, step, "project", projectId);
      }

      case "content/about.upserted":
        return await handleSingletonSource(trace, step, "about");
      case "content/welcome.upserted":
        return await handleSingletonSource(trace, step, "welcome");
      case "content/contact.upserted":
        return await handleSingletonSource(trace, step, "contact");

      case "knowledge/reindex.requested": {
        const { sourceType, sourceId } =
          event.data as Events["knowledge/reindex.requested"]["data"];

        if (sourceType) {
          if (isSingletonType(sourceType)) {
            return await handleSingletonSource(trace, step, sourceType);
          }
          if (sourceId) {
            return await handleScopedSource(trace, step, sourceType, sourceId);
          }
        }

        return await fanOutFullReindex(trace, step);
      }

      default: {
        const span = trace.span("unhandled-event", { name: event.name });
        span.end();
        return { kind: "skipped", reason: `unhandled event: ${event.name}` };
      }
    }
  } catch (err) {
    trace.end(undefined, { error: (err as Error).message });
    throw err;
  } finally {
    await trace.flush();
  }
}

export const regenerateEmbeddings = inngest.createFunction(
  {
    id: "regenerate-embeddings",
    concurrency: { limit: 5 },
    retries: 3,
    triggers: [
      { event: "content/post.published" },
      { event: "content/post.updated" },
      { event: "content/post.deleted" },
      { event: "content/project.upserted" },
      { event: "content/project.deleted" },
      { event: "content/welcome.upserted" },
      { event: "content/about.upserted" },
      { event: "content/contact.upserted" },
      { event: "knowledge/reindex.requested" },
    ],
  },
  async (ctx) =>
    regenerateEmbeddingsHandler({
      event: { name: ctx.event.name, data: ctx.event.data },
      step: ctx.step,
    }),
);

function isSingletonType(t: string): t is "about" | "welcome" | "contact" {
  return t === "about" || t === "welcome" || t === "contact";
}

async function handleScopedSource(
  trace: TraceHandle,
  step: Step,
  sourceType: "article" | "project",
  sourceId: string,
): Promise<StepResult> {
  const loadSpan = trace.span("load-source", { sourceType, sourceId });
  const source = await step.run("load-source", () =>
    loadOneSource(sourceType, sourceId),
  );
  loadSpan.end({ found: !!source });

  if (!source) {
    const span = trace.span("delete-stale", { sourceType, sourceId });
    const result = await step.run("delete-stale", () =>
      deleteSourceChunks(sourceType, sourceId),
    );
    span.end(result);
    return { kind: "deleted", deleted: result.deleted };
  }

  const upsertSpan = trace.span("upsert", {
    sourceType,
    sourceId,
    title: source.sourceTitle,
  });
  const result = await step.run("upsert", () => upsertSourceChunks(source));
  upsertSpan.end(result);
  return { kind: "upserted", ...result };
}

async function handleSingletonSource(
  trace: TraceHandle,
  step: Step,
  sourceType: "about" | "welcome" | "contact",
): Promise<StepResult> {
  const sweepSpan = trace.span("sweep-singleton", { sourceType });
  const sweep = await step.run("sweep-singleton", () =>
    sweepSingletonChunks(sourceType),
  );
  sweepSpan.end(sweep);

  const loadSpan = trace.span("load-source", { sourceType });
  const source = await step.run("load-source", () => loadOneSource(sourceType));
  loadSpan.end({ found: !!source });

  if (!source) {
    return { kind: "skipped", reason: "no singleton row to index" };
  }

  const upsertSpan = trace.span("upsert", {
    sourceType,
    sourceId: source.sourceId,
  });
  const result = await step.run("upsert", () => upsertSourceChunks(source));
  upsertSpan.end(result);
  return { kind: "upserted", ...result };
}

async function fanOutFullReindex(
  trace: TraceHandle,
  step: Step,
): Promise<StepResult> {
  const span = trace.span("enumerate-sources");
  const sources = await step.run("enumerate-sources", async () => {
    const [posts, projects] = await Promise.all([
      prisma.post.findMany({
        where: { status: "Published" },
        select: { id: true },
      }),
      prisma.project.findMany({
        where: { status: { not: "Draft" } },
        select: { id: true },
      }),
    ]);
    return {
      postIds: posts.map((p) => p.id),
      projectIds: projects.map((p) => p.id),
    };
  });
  span.end({
    postCount: sources.postIds.length,
    projectCount: sources.projectIds.length,
  });

  const events: Array<{
    name: "knowledge/reindex.requested";
    data: { sourceType: string; sourceId?: string };
  }> = [];

  for (const id of sources.postIds) {
    events.push({
      name: "knowledge/reindex.requested",
      data: { sourceType: "article", sourceId: id },
    });
  }
  for (const id of sources.projectIds) {
    events.push({
      name: "knowledge/reindex.requested",
      data: { sourceType: "project", sourceId: id },
    });
  }
  for (const t of ["about", "welcome", "contact"] as const) {
    events.push({
      name: "knowledge/reindex.requested",
      data: { sourceType: t },
    });
  }

  const sendSpan = trace.span("fan-out", { count: events.length });
  await step.sendEvent("fan-out-reindex", events);
  sendSpan.end({ emitted: events.length });

  return { kind: "fanout", emitted: events.length };
}
