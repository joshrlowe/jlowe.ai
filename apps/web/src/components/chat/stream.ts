// Client transport for the digital-twin chat. The backend is a streaming
// Lambda behind a same-origin `/api/chat` CloudFront behavior (CSP
// `connect-src 'self'` already permits it).
//
// The client always offers `Accept: application/x-jlowe-chat-frames`. A current
// Lambda answers with `\n\n`-terminated JSON frames (`application/x-ndjson`):
//   meta → text* → meeting_booking? → citations → done
// (`error` replaces `citations` on failure). A cached older Lambda still
// streams raw `text/plain` UTF-8 deltas; we detect that from Content-Type and
// yield them as `{ type: "text" }` so the new client doesn't break. All model
// config lives server-side; the request carries only the conversation and
// lightweight world grounding.

export const CHAT_FRAMES_ACCEPT = "application/x-jlowe-chat-frames";

/** Matches Lambda `encodeFrame` (`JSON.stringify(frame) + "\\n\\n"`). */
const FRAME_DELIM = "\n\n";

export type ChatRole = "user" | "assistant";

export interface Citation {
  index: number;
  title: string;
  url: string;
  snippet: string;
}

export interface MeetingBooking {
  url: string;
  message: string;
}

export interface ChatMessage {
  role: ChatRole;
  content: string;
  citations?: Citation[];
  meetingBooking?: MeetingBooking;
}

export interface ChatRequest {
  messages: ChatMessage[];
  context?: {
    collectedBeacons: string[];
  };
}

/**
 * Structured events yielded by `streamChat`. Mirrors the Lambda `ChatFrame`
 * union so the store can attach citations / a booking CTA instead of
 * concatenating opaque strings.
 */
export type ChatStreamEvent =
  | { type: "meta"; chunkCount: number; retrievalMs: number }
  | { type: "text"; content: string }
  | { type: "meeting_booking"; url: string; message: string }
  | { type: "citations"; items: Citation[] }
  | { type: "error"; message: string }
  | { type: "done" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mediaType(contentType: string | null): string {
  return (contentType ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
}

function isPlainText(contentType: string | null): boolean {
  return mediaType(contentType) === "text/plain";
}

function parseCitation(value: unknown): Citation | null {
  if (!isRecord(value)) return null;
  const { index, title, url, snippet } = value;
  if (
    typeof index !== "number" ||
    !Number.isFinite(index) ||
    typeof title !== "string" ||
    typeof url !== "string" ||
    typeof snippet !== "string"
  ) {
    return null;
  }
  // Empty hrefs are unusable as keyboard-accessible links; drop them.
  if (url.trim() === "") return null;
  return { index, title, url, snippet };
}

/**
 * Parse one JSON frame body. Malformed JSON, unknown types, and frames
 * missing required fields are dropped (null) so a single bad frame cannot
 * kill the rest of the stream.
 */
export function parseChatFrame(raw: string): ChatStreamEvent | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  let value: unknown;
  try {
    value = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (!isRecord(value) || typeof value.type !== "string") return null;

  switch (value.type) {
    case "text": {
      if (typeof value.content !== "string") return null;
      return { type: "text", content: value.content };
    }
    case "meta": {
      if (
        typeof value.chunkCount !== "number" ||
        typeof value.retrievalMs !== "number"
      ) {
        return null;
      }
      return {
        type: "meta",
        chunkCount: value.chunkCount,
        retrievalMs: value.retrievalMs,
      };
    }
    case "meeting_booking": {
      if (typeof value.url !== "string" || typeof value.message !== "string") {
        return null;
      }
      // PR 5 emits this frame with a real Cal.com URL. Never invent one.
      if (value.url.trim() === "") return null;
      return {
        type: "meeting_booking",
        url: value.url,
        message: value.message,
      };
    }
    case "citations": {
      if (!Array.isArray(value.items)) return null;
      const items: Citation[] = [];
      for (const item of value.items) {
        const parsed = parseCitation(item);
        if (parsed) items.push(parsed);
      }
      return { type: "citations", items };
    }
    case "error": {
      if (typeof value.message !== "string") return null;
      return { type: "error", message: value.message };
    }
    case "done":
      return { type: "done" };
    default:
      return null;
  }
}

/**
 * Pull complete `\n\n`-terminated JSON frames out of a buffer. Incomplete
 * trailing bytes stay in `rest` so the next TCP read can finish the frame.
 */
export function consumeFrames(buffer: string): {
  events: ChatStreamEvent[];
  rest: string;
} {
  const events: ChatStreamEvent[] = [];
  let rest = buffer;
  for (;;) {
    const boundary = rest.indexOf(FRAME_DELIM);
    if (boundary === -1) break;
    const raw = rest.slice(0, boundary);
    rest = rest.slice(boundary + FRAME_DELIM.length);
    const event = parseChatFrame(raw);
    if (event) events.push(event);
  }
  return { events, rest };
}

/** End-of-stream: drain complete frames, then try to parse a terminator-less tail. */
export function flushFrameBuffer(buffer: string): ChatStreamEvent[] {
  const { events, rest } = consumeFrames(buffer);
  const tail = parseChatFrame(rest);
  return tail ? [...events, tail] : events;
}

/**
 * Hex-encoded SHA-256 of a UTF-8 string via the Web Crypto API. The `/api/chat`
 * origin is a Lambda Function URL behind CloudFront Origin Access Control (OAC);
 * AWS's OAC-for-Lambda contract requires the viewer to send the POST body's
 * payload hash in `x-amz-content-sha256` so CloudFront can include it in the
 * SigV4 signature it sends to the Function URL (Lambda rejects unsigned
 * payloads). Verified: with this header, POST /api/chat returns 200 through the
 * dev CloudFront distribution.
 */
async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function* readPlainText(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
): AsyncGenerator<ChatStreamEvent, void, unknown> {
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      // stream: true keeps multi-byte UTF-8 sequences intact across chunks.
      const text = decoder.decode(value, { stream: true });
      if (text) yield { type: "text", content: text };
    }
    const tail = decoder.decode();
    if (tail) yield { type: "text", content: tail };
  } finally {
    reader.releaseLock();
  }
}

async function* readFrames(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
): AsyncGenerator<ChatStreamEvent, void, unknown> {
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const consumed = consumeFrames(buffer);
      buffer = consumed.rest;
      for (const event of consumed.events) yield event;
    }
    buffer += decoder.decode();
    for (const event of flushFrameBuffer(buffer)) yield event;
  } finally {
    reader.releaseLock();
  }
}

/**
 * POST the conversation and stream back structured chat events. Throws on a
 * non-OK response or a missing body; the caller (the store's `send`) is
 * responsible for surfacing that as an error state. The `signal` lets an
 * in-flight reply be aborted (e.g. on reset/unmount).
 */
export async function* streamChat(
  req: ChatRequest,
  signal: AbortSignal,
): AsyncGenerator<ChatStreamEvent, void, unknown> {
  const body = JSON.stringify(req);
  const payloadHash = await sha256Hex(body);
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      accept: CHAT_FRAMES_ACCEPT,
      "content-type": "application/json",
      "x-amz-content-sha256": payloadHash,
    },
    body,
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`chat request failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  if (isPlainText(res.headers.get("content-type"))) {
    yield* readPlainText(reader, decoder);
    return;
  }
  yield* readFrames(reader, decoder);
}
