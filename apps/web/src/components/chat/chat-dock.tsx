"use client";

import { SendHorizontalIcon, XIcon } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { chatStore } from "./chat-store";
import { useChat } from "./use-chat";

/**
 * Non-modal docked chat panel. A plain slide-in `<aside>` (not the Dialog-based
 * Sheet) — exactly like `beacon-panel.tsx` — so it never dims the page, traps
 * focus, or steals input: you can keep driving/reading with it open. Escape or
 * the close button dismisses it. Submitting sends; while a reply streams a
 * caret blinks on the live assistant message.
 */
export function ChatDock() {
  const open = useChat((s) => s.open);
  const messages = useChat((s) => s.messages);
  const status = useChat((s) => s.status);
  const input = useChat((s) => s.input);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Escape closes the dock while it's open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") chatStore.getState().close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus the input when the dock opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Keep the newest message in view as content streams in.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void chatStore.getState().send();
  };

  return (
    <aside
      aria-hidden={!open}
      aria-label="Digital twin chat"
      className={cn(
        "fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l bg-popover/95 text-popover-foreground shadow-lg backdrop-blur transition-transform duration-300 ease-out",
        open
          ? "pointer-events-auto translate-x-0"
          : "pointer-events-none translate-x-full",
      )}
    >
      <header className="flex items-start justify-between gap-4 border-b p-4">
        <div>
          <h2 className="font-heading text-lg font-medium">
            Ask Josh&apos;s digital twin
          </h2>
          <p className="text-sm text-muted-foreground">
            Answers grounded in Josh&apos;s work.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="-mt-1 -mr-1 shrink-0"
          onClick={() => chatStore.getState().close()}
          aria-label="Close chat"
        >
          <XIcon />
        </Button>
      </header>

      <div
        ref={listRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
      >
        {messages.length === 0 ? (
          <p className="m-auto max-w-[16rem] text-center text-sm text-muted-foreground">
            Ask about Josh&apos;s projects, experience, or the systems behind
            this site.
          </p>
        ) : (
          messages.map((m, i) => {
            const isUser = m.role === "user";
            const isLast = i === messages.length - 1;
            const streaming = !isUser && isLast && status === "streaming";
            return (
              <div
                key={i}
                data-role={m.role}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                  isUser
                    ? "self-end bg-primary text-primary-foreground"
                    : "self-start bg-muted text-foreground",
                )}
              >
                {m.content}
                {streaming ? (
                  <span
                    aria-hidden
                    className="ml-0.5 inline-block w-1.5 animate-pulse"
                  >
                    ▋
                  </span>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t p-4"
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => chatStore.getState().setInput(e.target.value)}
          placeholder="Ask a question…"
          aria-label="Message"
          autoComplete="off"
          enterKeyHint="send"
        />
        <Button
          type="submit"
          size="icon"
          className="shrink-0"
          disabled={status === "streaming" || input.trim() === ""}
          aria-label="Send message"
        >
          <SendHorizontalIcon />
        </Button>
      </form>
    </aside>
  );
}
