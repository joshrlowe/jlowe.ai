import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { Message } from "@aws-sdk/client-bedrock-runtime";
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
  beaconContext,
  buildConverseMessages,
  lastUserText,
  parseChatRequest,
} from "./messages.js";
import {
  RATE_LIMIT_TEXT,
  type SessionStore,
  type StoredMessage,
} from "./sessions.js";
import { defaultSessionStore } from "./store.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";

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

export interface ChatRuntime {
  search?: (
    query: string,
    options?: { topK?: number; sourceTypes?: string[] },
  ) => Promise<RetrievedChunk[]>;
  tokens?: (args: {
    system: string;
    messages: Message[];
  }) => AsyncIterable<string>;
  sessions?: SessionStore;
}

async function* bedrockTokens(args: {
  system: string;
  messages: Message[];
}): AsyncIterable<string> {
  const command = new ConverseStreamCommand({
    modelId: MODEL_ID,
    system: [{ text: args.system }],
    messages: args.messages,
    inferenceConfig: { maxTokens: 800, temperature: 0.4 },
  });
  const response = await getClient().send(command);
  for await (const item of response.stream ?? []) {
    if ("contentBlockDelta" in item) {
      const text = item.contentBlockDelta?.delta?.text;
      if (text) yield text;
    }
  }
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

  let allowed = true;
  try {
    const result = await sessions.checkRateLimit(sessionId, {
      ipHash: hashIp(viewerIp(event)),
      userAgent: viewerUserAgent(event),
    });
    allowed = result.allowed;
  } catch (error) {
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
    },
  });

  if (!allowed) {
    if (framed) {
      for (const frame of closingFrames(RATE_LIMIT_TEXT, [])) {
        stream.write(encodeFrame(frame));
      }
    } else {
      stream.write(RATE_LIMIT_TEXT);
    }
    stream.end();
    return;
  }

  const search = runtime.search ?? searchKnowledge;
  const tokens = runtime.tokens ?? bedrockTokens;

  try {
    const req = parseChatRequest(event.body);
    const query = lastUserText(req.messages);
    const nowIso = new Date().toISOString();

    const userMessage: StoredMessage = {
      role: "user",
      content: query,
      createdAt: nowIso,
    };
    await persistSafely("session_append_user_failed", () =>
      sessions.appendMessage(sessionId, userMessage),
    );

    const started = Date.now();
    const chunks = await search(query, { topK: TOP_K });
    const retrievalMs = Date.now() - started;

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

    let assistantText = "";
    for await (const text of tokens({
      system,
      messages: buildConverseMessages(req.messages),
    })) {
      assistantText += text;
      if (framed) stream.write(encodeFrame({ type: "text", content: text }));
      else stream.write(text);
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

    if (framed) {
      for (const frame of closingFrames(undefined, citations)) {
        stream.write(encodeFrame(frame));
      }
    }
  } catch (error) {
    log({ level: "error", msg: "chat_failed", error: String(error) });
    if (framed) {
      for (const frame of closingFrames(FAIL_OPEN_TEXT, [])) {
        stream.write(encodeFrame(frame));
      }
    } else {
      stream.write(`\n\n${FAIL_OPEN_TEXT}`);
    }
  } finally {
    stream.end();
  }
}

export const handler = awslambda.streamifyResponse(
  (event: APIGatewayProxyEventV2, responseStream) =>
    handleChatEvent(event, responseStream),
);
