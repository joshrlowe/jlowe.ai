/**
 * RAG Chat API + funnel.
 *
 * POST /api/chat
 * Body: { messages: [{ role: "user"|"assistant", content: string }] }
 * Returns: server-sent events (text/event-stream) with JSON-framed payloads.
 *
 * Stream events (in order):
 *   - `data: {"type":"text","content":"..."}\n\n`               (one per text chunk)
 *   - `event: meeting_booking\ndata: {"url":"...","message":"..."}\n\n`  (optional, single fire)
 *   - `event: citations\ndata: {"items":[...]}\n\n`             (always at end)
 *
 * Side effects:
 *   - Upserts a ChatSession row keyed on the chat_session_id cookie.
 *   - Persists user + assistant ChatMessageRow rows.
 *   - Classifies each user message via Claude Haiku (parallel with retrieval).
 *   - Exposes `book_meeting` tool to the model only after a session shows
 *     evaluating intent and only until it has been called once.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { searchKnowledge, type RetrievedChunk } from "@/lib/rag/vector-search";
import { streamChatResponse, type ToolSpec } from "@/lib/bedrock/client";
import type { Message } from "@/lib/bedrock/client";
import { checkRateLimit } from "@/lib/utils/rateLimit";
import { startTrace } from "@/lib/observability/langfuse";
import { getOrCreateSessionId } from "@/lib/observability/session";
import { getClientIp, hashIp } from "@/lib/observability/ip";
import {
  classifyIntent,
  highestPriorityIntent,
  type Intent,
} from "@/lib/chat/intent";
import { bookMeetingTool, getCalcomBookingUrl } from "@/lib/chat/tools";

const SYSTEM_PROMPT_BASE = `You are Vulture, Josh Lowe's AI assistant. You help visitors learn about Josh's background, projects, research, and experience. Be helpful, concise, and professional. If you don't know something, say so. Do not make up information.`;
const CLAUDE_MODEL_ID = "anthropic.claude-3-5-sonnet-20241022-v2:0";

function validateMessages(messages: unknown): asserts messages is Message[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("messages must be a non-empty array");
  }
  for (const m of messages) {
    if (!m || typeof m.role !== "string" || typeof m.content !== "string") {
      throw new Error(
        "Each message must have role (string) and content (string)",
      );
    }
    if (m.role !== "user" && m.role !== "assistant") {
      throw new Error("role must be 'user' or 'assistant'");
    }
  }
}

interface Citation {
  index: number;
  title: string;
  url: string;
  snippet: string;
}

function urlFor(c: RetrievedChunk): string | null {
  if (c.sourceType === "article" && c.sourceSlug)
    return `/articles/${c.sourceSlug}`;
  if (c.sourceType === "project" && c.sourceSlug)
    return `/projects/${c.sourceSlug}`;
  if (c.sourceType === "about") return "/about";
  if (c.sourceType === "welcome") return "/";
  if (c.sourceType === "contact") return "/contact";
  return null;
}

function buildCitations(chunks: RetrievedChunk[]): Citation[] {
  return chunks
    .map((c, i): Citation | null => {
      const url = urlFor(c);
      if (!url) return null;
      const headingTail = c.headingPath.length
        ? ` — ${c.headingPath[c.headingPath.length - 1]}`
        : "";
      const snippet = c.content.length > 200
        ? c.content.slice(0, 200).trim() + "…"
        : c.content.trim();
      return {
        index: i + 1,
        title: c.sourceTitle + headingTail,
        url,
        snippet,
      };
    })
    .filter((c): c is Citation => c !== null);
}

function formatContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c, i) => {
      const heading = c.headingPath.length
        ? ` › ${c.headingPath.join(" › ")}`
        : "";
      return `[${i + 1}] ${c.sourceTitle}${heading}\n${c.content}`;
    })
    .join("\n\n---\n\n");
}

function writeEvent(
  res: NextApiResponse,
  payload: { type: "text"; content: string },
): void;
function writeEvent(
  res: NextApiResponse,
  payload: { type: "citations"; items: Citation[] },
  eventName: "citations",
): void;
function writeEvent(
  res: NextApiResponse,
  payload: { type: "meeting_booking"; url: string; message: string },
  eventName: "meeting_booking",
): void;
function writeEvent(
  res: NextApiResponse,
  payload: unknown,
  eventName?: string,
): void {
  const lines: string[] = [];
  if (eventName) lines.push(`event: ${eventName}`);
  lines.push(`data: ${JSON.stringify(payload)}`);
  res.write(lines.join("\n") + "\n\n");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const sessionId = getOrCreateSessionId(req, res);
  const ipHashed = hashIp(getClientIp(req));

  const trace = await startTrace({
    name: "chat",
    sessionId,
    metadata: {
      ipHash: ipHashed,
      userAgent: req.headers["user-agent"] ?? null,
    },
  });
  if (trace.id) {
    res.setHeader("x-trace-id", trace.id);
  }

  const rlSpan = trace.span("rate-limit", { keyPrefix: "chat" });
  const allowed = await checkRateLimit(req, res, {
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: "chat",
  });
  rlSpan.end({ allowed });
  if (!allowed) {
    trace.end({ status: "rate_limited" });
    void trace.flush();
    return;
  }

  let messages: Message[];
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    messages = body?.messages;
    validateMessages(messages);
  } catch (err) {
    const message = (err as Error).message || "Invalid request body";
    trace.end({ status: "bad_request", error: message });
    void trace.flush();
    res.status(400).json({ error: message });
    return;
  }

  // Upsert the chat session.
  const session = await prisma.chatSession.upsert({
    where: { sessionId },
    update: {},
    create: {
      sessionId,
      ipHash: ipHashed,
      userAgent: (req.headers["user-agent"] as string | undefined) ?? null,
    },
  });

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const userText = lastUserMessage?.content?.trim() || "Josh Lowe portfolio";
  const history = messages
    .slice(0, -1)
    .map((m) => ({ role: m.role, content: m.content }));

  // Persist user message + classify + retrieve in parallel.
  let intent: Intent;
  let retrieved: RetrievedChunk[];
  try {
    const [, classified, results] = await Promise.all([
      prisma.chatMessageRow.create({
        data: { sessionId, role: "user", content: userText },
      }),
      classifyIntent(userText, history, { trace }),
      searchKnowledge(userText, { topK: 5, trace }),
    ]);
    intent = classified;
    retrieved = results;
  } catch (err) {
    trace.end({ status: "error", error: (err as Error).message });
    void trace.flush();
    res.status(500).json({
      error: (err as Error).message || "Internal server error",
    });
    return;
  }

  const becomesQualified = session.qualified || intent === "evaluating";
  const tools: ToolSpec[] =
    becomesQualified && !session.bookingOffered ? [bookMeetingTool] : [];

  const formatted = formatContext(retrieved);
  const citations = buildCitations(retrieved);
  const systemPrompt =
    `${SYSTEM_PROMPT_BASE}\n\n` +
    `Use the following sources to answer. Cite them inline using [1], [2], etc., matching the numbers below. ` +
    `If the sources don't contain relevant information, say so.\n\n${formatted}`;

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.status(200);
  (res as unknown as { flushHeaders?: () => void }).flushHeaders?.();

  // Strip name/email from input logged to Langfuse — PII protection.
  const generation = trace.generation({
    name: "claude-3-5-sonnet",
    model: CLAUDE_MODEL_ID,
    input: { systemPrompt, messages, toolsExposed: tools.map((t) => t.name) },
    modelParameters: { maxTokens: 500, temperature: 0.7 },
  });

  let fullText = "";
  let inputTokens: number | undefined;
  let outputTokens: number | undefined;
  let bookingPayload: { url: string; message: string } | null = null;
  let capturedName: string | undefined;
  let capturedEmail: string | undefined;
  const startMs = Date.now();

  try {
    for await (const chunk of streamChatResponse({
      messages,
      systemPrompt,
      maxTokens: 500,
      temperature: 0.7,
      tools: tools.length ? tools : undefined,
      onFirstToken: () => generation.recordFirstToken(),
      onUsage: (u) => {
        if (u.inputTokens !== undefined) inputTokens = u.inputTokens;
        if (u.outputTokens !== undefined) outputTokens = u.outputTokens;
      },
      onToolUse: (call) => {
        if (call.name !== "book_meeting" || bookingPayload) return;
        const input = call.input as {
          topicSummary?: string;
          name?: string;
          email?: string;
        };
        if (!input.topicSummary) return;
        const url = getCalcomBookingUrl({
          topicSummary: input.topicSummary,
          name: input.name,
          email: input.email,
        });
        if (!url) return;
        capturedName = input.name;
        capturedEmail = input.email;
        bookingPayload = {
          url,
          message:
            "Want to chat about this in more depth? Here's a quick way to grab 30 minutes with Josh.",
        };
      },
    })) {
      fullText += chunk;
      writeEvent(res, { type: "text", content: chunk });
    }

    if (bookingPayload) {
      const payload = bookingPayload as { url: string; message: string };
      writeEvent(
        res,
        { type: "meeting_booking", url: payload.url, message: payload.message },
        "meeting_booking",
      );
    }
    writeEvent(res, { type: "citations", items: citations }, "citations");

    generation.recordUsage({ input: inputTokens, output: outputTokens });
    generation.end(fullText);
    trace.end({
      status: "ok",
      latencyMs: Date.now() - startMs,
      citationCount: citations.length,
      intent,
      bookingOffered: !!bookingPayload,
    });

    // Persist outcomes. Tag the latest untagged user row with intent.
    const newTraceIds = trace.id
      ? Array.from(new Set([...session.langfuseTraceIds, trace.id]))
      : session.langfuseTraceIds;

    const bookingPayloadForDb = bookingPayload as {
      url: string;
      message: string;
    } | null;
    await prisma.$transaction([
      prisma.chatMessageRow.create({
        data: {
          sessionId,
          role: "assistant",
          content: fullText,
          toolCalls: bookingPayloadForDb
            ? { name: "book_meeting", url: bookingPayloadForDb.url }
            : undefined,
        },
      }),
      prisma.chatMessageRow.updateMany({
        where: { sessionId, role: "user", intent: null },
        data: { intent },
      }),
      prisma.chatSession.update({
        where: { sessionId },
        data: {
          qualified: becomesQualified,
          bookingOffered: session.bookingOffered || !!bookingPayloadForDb,
          topIntent: highestPriorityIntent(session.topIntent, intent),
          langfuseTraceIds: newTraceIds,
          ...(capturedName ? { capturedName } : {}),
          ...(capturedEmail ? { capturedEmail } : {}),
        },
      }),
    ]);
  } catch (err) {
    generation.fail(err as Error);
    trace.end({ status: "error", error: (err as Error).message });
    console.error("[chat]", err);
    if (!res.headersSent) {
      res.status(500).json({
        error: (err as Error).message || "Internal server error",
      });
    }
  } finally {
    void trace.flush();
    res.end();
  }
}
