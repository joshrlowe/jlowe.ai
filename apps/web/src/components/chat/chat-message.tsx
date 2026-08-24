"use client";

import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { ChatMessage, Citation, MeetingBooking } from "./stream";

/**
 * Turn `[1]` markers in the assistant text into in-place links when a matching
 * citation exists. Unmatched markers stay as literal text.
 */
function renderWithCitations(
  content: string,
  citations: Citation[] | undefined,
): ReactNode {
  if (!citations?.length) return content;
  const parts = content.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = /^\[(\d+)\]$/.exec(part);
    if (!match) return <Fragment key={i}>{part}</Fragment>;
    const index = Number(match[1]);
    const cite = citations.find((c) => c.index === index);
    if (!cite) return <Fragment key={i}>{part}</Fragment>;
    return (
      <a
        key={i}
        href={cite.url}
        title={cite.title}
        aria-label={`Source ${index}: ${cite.title}`}
        className="mx-0.5 align-super rounded-sm text-[10px] text-starlight underline-offset-2 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        [{index}]
      </a>
    );
  });
}

function CitationList({ citations }: { citations: Citation[] }) {
  if (citations.length === 0) return null;
  return (
    <nav aria-label="Sources" className="mt-2">
      <p className="font-mono text-[10px] font-medium tracking-[0.35em] text-starlight uppercase">
        Sources
      </p>
      <ol className="mt-1.5 flex flex-col gap-1">
        {citations.map((cite) => (
          <li key={cite.index} value={cite.index}>
            <a
              href={cite.url}
              title={cite.snippet}
              className="group flex items-baseline gap-2 rounded-sm text-xs text-muted-foreground transition-colors hover:text-starlight focus-visible:text-starlight focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="font-mono text-starlight tabular-nums">
                [{cite.index}]
              </span>
              <span className="underline-offset-4 group-hover:underline group-focus-visible:underline">
                {cite.title}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function BookingCard({ booking }: { booking: MeetingBooking }) {
  // URL comes from the `meeting_booking` frame (PR 5). Never synthesize Cal.com.
  if (booking.url.trim() === "") return null;
  return (
    <aside
      aria-label="Book a meeting"
      className="mt-3 rounded-lg border border-cobalt/40 bg-card/80 p-3 shadow-glow-sm"
    >
      <p className="font-mono text-[10px] font-medium tracking-[0.35em] text-starlight uppercase">
        Book a meeting
      </p>
      {booking.message ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {booking.message}
        </p>
      ) : null}
      <a
        href={booking.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex rounded-sm text-sm text-starlight underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        Book a time
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </aside>
  );
}

/**
 * One bubble in the dock. User turns are plain text; assistant turns grow
 * citations + an optional booking CTA under the reply, using the same HUD
 * micro-label grammar as the rest of the shell (starlight mono, cobalt marks).
 */
export function ChatBubble({
  message,
  streaming,
}: {
  message: ChatMessage;
  streaming: boolean;
}) {
  const isUser = message.role === "user";
  const citations = message.citations ?? [];

  return (
    <div
      data-role={message.role}
      className={cn(
        "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed",
        isUser
          ? "self-end bg-primary text-primary-foreground"
          : "self-start bg-muted text-foreground",
      )}
    >
      <div className="whitespace-pre-wrap">
        {isUser
          ? message.content
          : renderWithCitations(message.content, message.citations)}
        {streaming ? (
          <span aria-hidden className="ml-0.5 inline-block w-1.5 animate-pulse">
            ▋
          </span>
        ) : null}
      </div>
      {!isUser && message.meetingBooking ? (
        <BookingCard booking={message.meetingBooking} />
      ) : null}
      {!isUser && citations.length > 0 ? (
        <CitationList citations={citations} />
      ) : null}
    </div>
  );
}
