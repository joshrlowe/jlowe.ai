import { Fragment, useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import type { ChatMessage as ChatMessageData, Citation } from "./types";

interface ChatMessageProps {
  message: ChatMessageData;
}

function renderWithCitations(content: string, citations?: Citation[]): ReactNode {
  if (!citations?.length) return content;
  const parts = content.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[(\d+)\]$/);
    if (!m) return <Fragment key={i}>{part}</Fragment>;
    const idx = Number(m[1]);
    const cite = citations.find((c) => c.index === idx);
    if (!cite) return <Fragment key={i}>{part}</Fragment>;
    return (
      <a
        key={i}
        href={cite.url}
        target="_blank"
        rel="noopener noreferrer"
        title={cite.title}
        className="align-super text-[10px] mx-0.5 text-[var(--color-primary)] hover:underline"
      >
        [{idx}]
      </a>
    );
  });
}

export default function ChatMessageBubble({ message }: ChatMessageProps) {
  const [voted, setVoted] = useState<1 | -1 | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isUser = message.role === "user";

  const vote = async (score: 1 | -1) => {
    if (!message.traceId || voted || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traceId: message.traceId, score }),
      });
      if (!res.ok && res.status !== 204) {
        throw new Error(`Feedback failed: ${res.status}`);
      }
      setVoted(score);
      toast.success("Thanks for the feedback");
    } catch {
      toast.error("Couldn't send feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] px-4 py-2 rounded-2xl ${
          isUser
            ? "bg-[var(--color-primary)] text-white rounded-br-sm"
            : "bg-[var(--color-bg-darker)] text-[var(--color-text-primary)] rounded-bl-sm"
        } ${message.errored ? "border border-red-500/40" : ""}`}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content
            ? renderWithCitations(message.content, message.citations)
            : (isUser ? "" : "…")}
        </div>
        {!isUser && message.meetingBooking && (
          <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/15 to-[var(--color-bg-card)] border border-[var(--color-primary)]/40">
            <div className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
              Want to dive deeper?
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mb-3">
              {message.meetingBooking.message}
            </p>
            <a
              href={message.meetingBooking.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              Book a 30-min call →
            </a>
          </div>
        )}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.citations.map((c) => (
              <a
                key={c.index}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                title={c.snippet}
                className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors"
              >
                [{c.index}] {c.title} →
              </a>
            ))}
          </div>
        )}
        {!isUser && message.traceId && (
          <div className="mt-2 flex items-center gap-1 text-[var(--color-text-muted)]">
            <button
              type="button"
              onClick={() => vote(1)}
              disabled={voted !== null || submitting}
              aria-label="Helpful"
              className={`p-1 rounded transition-colors ${
                voted === 1
                  ? "text-green-400"
                  : "hover:text-green-400 disabled:opacity-40"
              }`}
            >
              <svg className="w-4 h-4" fill={voted === 1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => vote(-1)}
              disabled={voted !== null || submitting}
              aria-label="Not helpful"
              className={`p-1 rounded transition-colors ${
                voted === -1
                  ? "text-red-400"
                  : "hover:text-red-400 disabled:opacity-40"
              }`}
            >
              <svg className="w-4 h-4" fill={voted === -1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
