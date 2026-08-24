import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { Message, Tool } from "@aws-sdk/client-bedrock-runtime";
import { searchKnowledge, type RetrievedChunk } from "@velocity/corpus-index";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

import { buildCitations, formatContext } from "./citations.js";
import { getOrMintSessionId, sessionCookieHeader } from "./cookie.js";
import {
  CHAT_FRAMES_CONTENT_TYPE,
  CHAT_RAW_CONTENT_TYPE,
  closingFrames,
  encodeFrame,
  wantsFrames,
} from "./frames.js";
import { hashIp, viewerIp, viewerUserAgent } from "./ip.js";
import {
  classifyIntent,
  highestPriorityIntent,
  type ConversationTurn,
  type Intent,
} from "./intent.js";
import {
  beaconContext,
  buildConverseMessages,
  lastUserText,
  parseChatRequest,
} from "./messages.js";
import {
  RATE_LIMIT_TEXT,
  type ChatSession,
  type SessionStore,
  type StoredMessage,
} from "./sessions.js";
import { startTrace, type TraceHandle } from "./langfuse.js";
import { defaultSessionStore } from "./store.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";
import { IDLE, reduceStreamItem, type ToolCall } from "./tool-assembler.js";
import {
  BOOKING_CTA,
  bookMeetingTool,
  getCalcomBookingUrl,
  isCalcomConfigured,
  shouldExposeBookingTool,
  type CalcomUrlInput,
} from "./tools.js";

const MODEL_ID =
  process.env.BEDROCK_MODEL_ID ?? "us.anthropic.claude-haiku-4-5-20251001-v1:0";
const TOP_K = 5;

export const FAIL_OPEN_TEXT =
  "Sorry — I hit a snag answering that. Please try again in a moment.";

let client: BedrockRuntimeClient | undefined;

function getClient(): BedrockRuntimeClient {
  return (client ??= new BedrockRuntimeClient({}));
}

function log(fields: Record<string, unknown>): void {
  console.error(JSON.stringify(fields));
}

async function persistSafely(
  label: string,
  fn: () => Promise<unknown>,
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    log({ level: "warn", msg: label, error: String(error) });
  }
}

export interface TokenArgs {
  system: string;
  messages: Message[];
  tools?: Tool[];
  onToolUse?: (call: ToolCall) => void;
}

export interface ChatRuntime {
  search?: (
    query: string,
    options?: { topK?: number; sourceTypes?: string[] },
  ) => Promise<RetrievedChunk[]>;
  tokens?: (args: TokenArgs) => AsyncIterable<string>;
  sessions?: SessionStore;
  classifyIntent?: (
    message: string,
    history: ConversationTurn[],
  ) => Promise<Intent>;
  calcomConfigured?: boolean;
  bookingUrl?: (input: CalcomUrlInput) => string | null;
  startTrace?: (params: {
    name: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<TraceHandle>;
}

async function* bedrockTokens(args: TokenArgs): AsyncIterable<string> {
  const command = new ConverseStreamCommand({
    modelId: MODEL_ID,
    system: [{ text: args.system }],
    messages: args.messages,
    inferenceConfig: { maxTokens: 800, temperature: 0.4 },
    ...(args.tools && args.tools.length > 0
      ? { toolConfig: { tools: args.tools } }
      : {}),
  });
  const response = await getClient().send(command);
  let state = IDLE;
  for await (const item of response.stream ?? []) {
    const out = reduceStreamItem(state, item);
    state = out.state;
    if (out.text) yield out.text;
    if (out.toolCall) args.onToolUse?.(out.toolCall);
  }
}

function asCalcomInput(input: Record<string, unknown>): CalcomUrlInput | null {
  if (
    typeof input.topicSummary !== "string" ||
    input.topicSummary.trim() === ""
  ) {
    return null;
  }
  const parsed: CalcomUrlInput = { topicSummary: input.topicSummary };
  if (typeof input.name === "string" && input.name.trim() !== "") {
    parsed.name = input.name;
  }
  if (typeof input.email === "string" && input.email.trim() !== "") {
    parsed.email = input.email;
  }
  return parsed;
}

/**
 * Streaming digital-twin chat. Validates the request, retrieves grounding
 * chunks, and streams Bedrock ConverseStream text. **Fails open**: any error
 * still ends the stream (friendly line in raw mode; `error`+`done` frames
 * when negotiated) so the UI never hangs.
 *
 * Accept negotiation: `application/x-jlowe-chat-frames` or `text/event-stream`
 * → framed `application/x-ndjson`; otherwise today's raw `text/plain` deltas.
 *
 * Session cookie + HTTP status are set on `HttpResponseStream.from` **before
 * the first write**. On a streaming Function URL the prelude is frozen at
 * that call; a later `Set-Cookie` would be dropped.
 *
 * `book_meeting` is gated on `(qualified || intent === "evaluating") &&
 * !bookingOffered` and fails closed when Cal.com is not configured.
 */
export async function handleChatEvent(
  event: APIGatewayProxyEventV2,
  responseStream: awslambda.ResponseStream,
  runtime: ChatRuntime = {},
): Promise<void> {
  const accept = event.headers?.accept ?? event.headers?.Accept;
  const framed = wantsFrames(accept);
  const sessionId = getOrMintSessionId(event);
  const sessions = runtime.sessions ?? defaultSessionStore();
  const ipHashed = hashIp(viewerIp(event));
  const beginTrace = runtime.startTrace ?? startTrace;
  const trace = await beginTrace({
    name: "chat",
    sessionId,
    metadata: { ipHash: ipHashed, userAgent: viewerUserAgent(event) },
  });

  let allowed = true;
  let session: ChatSession | undefined;
  const rlSpan = trace.span("rate-limit");
  try {
    const result = await sessions.checkRateLimit(sessionId, {
      ipHash: ipHashed,
      userAgent: viewerUserAgent(event),
    });
    allowed = result.allowed;
    session = result.session;
    rlSpan.end({ allowed });
  } catch (error) {
    rlSpan.fail(error as Error);
    log({
      level: "warn",
      msg: "session_rate_limit_failed",
      error: String(error),
    });
    allowed = true;
  }

  const stream = awslambda.HttpResponseStream.from(responseStream, {
    statusCode: allowed ? 200 : 429,
    headers: {
      "content-type": framed ? CHAT_FRAMES_CONTENT_TYPE : CHAT_RAW_CONTENT_TYPE,
      "cache-control": "no-store",
      "set-cookie": sessionCookieHeader(sessionId),
      ...(trace.id ? { "x-trace-id": trace.id } : {}),
    },
  });

  try {
    if (!allowed) {
      if (framed) {
        for (const frame of closingFrames(RATE_LIMIT_TEXT, [])) {
          stream.write(encodeFrame(frame));
        }
      } else {
        stream.write(RATE_LIMIT_TEXT);
      }
      trace.end({ status: "rate_limited" });
      return;
    }

    const search = runtime.search ?? searchKnowledge;
    const tokens = runtime.tokens ?? bedrockTokens;
    const classify = runtime.classifyIntent ?? classifyIntent;
    const calcomConfigured = runtime.calcomConfigured ?? isCalcomConfigured();
    const bookingUrl = runtime.bookingUrl ?? getCalcomBookingUrl;

    const req = parseChatRequest(event.body);
    const query = lastUserText(req.messages);
    const history: ConversationTurn[] = req.messages.slice(0, -1);

    const started = Date.now();
    const retrievalSpan = trace.span("retrieval");
    const [intent, chunks] = await Promise.all([
      classify(query, history),
      search(query, { topK: TOP_K }),
    ]);
    const retrievalMs = Date.now() - started;
    retrievalSpan.end({ chunkCount: chunks.length, retrievalMs, intent });

    const userMessage: StoredMessage = {
      role: "user",
      content: query,
      createdAt: new Date().toISOString(),
      intent,
    };
    await persistSafely("session_append_user_failed", () =>
      sessions.appendMessage(sessionId, userMessage),
    );

    if (framed) {
      stream.write(
        encodeFrame({
          type: "meta",
          chunkCount: chunks.length,
          retrievalMs,
        }),
      );
    }

    const citations = buildCitations(chunks);
    const system =
      SYSTEM_PROMPT +
      beaconContext(req.context) +
      "\n\n" +
      formatContext(chunks);

    const exposeTool = session
      ? shouldExposeBookingTool({
          qualified: session.qualified,
          bookingOffered: session.bookingOffered,
          intent,
          calcomConfigured,
        })
      : false;

    let booking:
      | { url: string; message: string; name?: string; email?: string }
      | undefined;

    let assistantText = "";
    const generation = trace.generation({
      name: "haiku",
      model: MODEL_ID,
      input: { toolsExposed: exposeTool },
      modelParameters: { maxTokens: 800, temperature: 0.4 },
    });
    try {
      for await (const text of tokens({
        system,
        messages: buildConverseMessages(req.messages),
        tools: exposeTool ? [bookMeetingTool] : undefined,
        onToolUse: (call) => {
          if (!exposeTool) return;
          if (call.name !== "book_meeting" || booking) return;
          const input = asCalcomInput(call.input);
          if (!input) return;
          const url = bookingUrl(input);
          if (!url) return;
          booking = {
            url,
            message: BOOKING_CTA,
            name: input.name,
            email: input.email,
          };
        },
      })) {
        if (!assistantText) generation.recordFirstToken();
        assistantText += text;
        if (framed) stream.write(encodeFrame({ type: "text", content: text }));
        else stream.write(text);
      }
      generation.end(assistantText);
    } catch (error) {
      generation.fail(error as Error);
      throw error;
    }

    if (framed && booking) {
      stream.write(
        encodeFrame({
          type: "meeting_booking",
          url: booking.url,
          message: booking.message,
        }),
      );
    }

    if (assistantText) {
      await persistSafely("session_append_assistant_failed", () =>
        sessions.appendMessage(sessionId, {
          role: "assistant",
          content: assistantText,
          createdAt: new Date().toISOString(),
        }),
      );
    }

    if (session) {
      await persistSafely("session_update_failed", () =>
        sessions.update(sessionId, {
          qualified: session.qualified || intent === "evaluating",
          bookingOffered: session.bookingOffered || Boolean(booking),
          topIntent: highestPriorityIntent(session.topIntent, intent),
          ...(booking?.name ? { capturedName: booking.name } : {}),
          ...(booking?.email ? { capturedEmail: booking.email } : {}),
        }),
      );
    }

    if (framed) {
      for (const frame of closingFrames(undefined, citations)) {
        stream.write(encodeFrame(frame));
      }
    }
    trace.end({
      status: "ok",
      intent,
      bookingOffered: Boolean(booking),
    });
  } catch (error) {
    log({ level: "error", msg: "chat_failed", error: String(error) });
    trace.end({ status: "error", error: String(error) });
    if (framed) {
      for (const frame of closingFrames(FAIL_OPEN_TEXT, [])) {
        stream.write(encodeFrame(frame));
      }
    } else {
      stream.write(`\n\n${FAIL_OPEN_TEXT}`);
    }
  } finally {
    // Flush AFTER end: Lambda freezes the environment when this function
    // returns, so a fire-and-forget flush would drop the trace.
    stream.end();
    await trace.flush();
  }
}

export const handler = awslambda.streamifyResponse(
  (event: APIGatewayProxyEventV2, responseStream) =>
    handleChatEvent(event, responseStream),
);
