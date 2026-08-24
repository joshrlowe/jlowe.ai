import type { CitationItem } from "./citations.js";

export const CHAT_FRAMES_ACCEPT = "application/x-jlowe-chat-frames";
export const CHAT_FRAMES_CONTENT_TYPE = "application/x-ndjson; charset=utf-8";
export const CHAT_RAW_CONTENT_TYPE = "text/plain; charset=utf-8";

export type ChatFrame =
  | { type: "meta"; chunkCount: number; retrievalMs: number }
  | { type: "text"; content: string }
  | { type: "meeting_booking"; url: string; message: string }
  | { type: "citations"; items: CitationItem[] }
  | { type: "error"; message: string }
  | { type: "done" };

/** Framed mode when Accept includes our frames type or SSE. */
export function wantsFrames(acceptHeader: string | undefined): boolean {
  if (!acceptHeader) return false;
  const accept = acceptHeader.toLowerCase();
  return (
    accept.includes(CHAT_FRAMES_ACCEPT) || accept.includes("text/event-stream")
  );
}

export function encodeFrame(frame: ChatFrame): string {
  return `${JSON.stringify(frame)}\n\n`;
}

/**
 * Closing frames: `error` replaces `citations`. Never both. Always `done`.
 */
export function closingFrames(
  errorMessage: string | undefined,
  citations: CitationItem[],
): Array<Extract<ChatFrame, { type: "citations" | "error" | "done" }>> {
  if (errorMessage !== undefined) {
    return [{ type: "error", message: errorMessage }, { type: "done" }];
  }
  return [{ type: "citations", items: citations }, { type: "done" }];
}
