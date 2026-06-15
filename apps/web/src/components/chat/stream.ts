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
 * POST the conversation and stream back the assistant's reply as raw text
 * deltas. Throws on a non-OK response or a missing body; the caller (the
 * store's `send`) is responsible for surfacing that as an error state. The
 * `signal` lets an in-flight reply be aborted (e.g. on reset/unmount).
 */
export async function* streamChat(
  req: ChatRequest,
  signal: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
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
