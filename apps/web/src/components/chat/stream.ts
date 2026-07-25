// Client transport for the digital-twin chat. The backend is a streaming
// Lambda behind a same-origin `/api/chat` CloudFront behavior (CSP
// `connect-src 'self'` already permits it). The response is NOT SSE/JSON —
// it's a stream of raw `text/plain` UTF-8 deltas, so we just decode and yield
// each chunk as it arrives. All model config lives server-side; the request
// carries only the conversation and lightweight world grounding.

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  context?: {
    collectedBeacons: string[];
  };
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

/**
 * POST the conversation and stream back the assistant's reply as raw text
 * deltas. Throws on a non-OK response or a missing body; the caller (the
 * store's `send`) is responsible for surfacing that as an error state. The
 * `signal` lets an in-flight reply be aborted (e.g. on reset/unmount).
 */
export async function* streamChat(
  req: ChatRequest,
  signal: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  const body = JSON.stringify(req);
  const payloadHash = await sha256Hex(body);
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
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
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      // stream: true keeps multi-byte UTF-8 sequences intact across chunks.
      const text = decoder.decode(value, { stream: true });
      if (text) yield text;
    }
    // Flush any trailing bytes the decoder buffered.
    const tail = decoder.decode();
    if (tail) yield tail;
  } finally {
    reader.releaseLock();
  }
}
