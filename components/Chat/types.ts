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
  /** Set on assistant messages once x-trace-id header is read. */
  traceId?: string | null;
  /** Marked true when streaming fails so the bubble can render an error state. */
  errored?: boolean;
  /** Sources surfaced by the citations event at end of stream. */
  citations?: Citation[];
  /** Booking CTA surfaced when the model fired the book_meeting tool. */
  meetingBooking?: MeetingBooking;
}
