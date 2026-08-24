import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { chapterStore } from "@/components/world/state/chapter-store";

import { type ChatMessage, type ChatStreamEvent, streamChat } from "./stream";

export type ChatStatus = "idle" | "streaming" | "error";

const ERROR_FALLBACK =
  "Sorry — I couldn't reach the digital twin just now. Please try again in a moment.";

export interface ChatState {
  messages: ChatMessage[];
  status: ChatStatus;
  open: boolean;
  input: string;
  toggle: () => void;
  close: () => void;
  setInput: (value: string) => void;
  send: () => Promise<void>;
  reset: () => void;
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

/** Keep the persisted transcript bounded — only the tail matters on reload. */
const PERSISTED_MESSAGES = 20;

/**
 * Fold a stream event into the live assistant turn. Text concatenates; citations
 * and a booking CTA attach as structured fields (never invent a Cal.com URL —
 * that arrives on the `meeting_booking` frame). An `error` frame keeps any
 * partial text already streamed, otherwise uses the server message.
 */
export function foldAssistantEvent(
  message: ChatMessage,
  event: ChatStreamEvent,
): ChatMessage {
  switch (event.type) {
    case "text":
      return { ...message, content: message.content + event.content };
    case "citations":
      return { ...message, citations: event.items };
    case "meeting_booking":
      return {
        ...message,
        meetingBooking: { url: event.url, message: event.message },
      };
    case "error":
      return {
        ...message,
        content: message.content || event.message || ERROR_FALLBACK,
      };
    case "meta":
    case "done":
      return message;
  }
}

/**
 * Vanilla store for the docked digital-twin chat. Mirrors `chapter-store.ts`:
 * the panel subscribes via `useChat`, while `send()` drives a same-origin
 * streaming POST and folds each framed event into the live assistant message.
 * Only the last ~20 `messages` persist (key `velocity-chat`) — the open/input/
 * status are session UI, not history.
 */
export const chatStore = createStore<ChatState>()(
  persist(
    (set, get) => {
      // Aborts an in-flight reply when the user resets mid-stream.
      let controller: AbortController | null = null;

      return {
        messages: [],
        status: "idle",
        open: false,
        input: "",

        toggle: () => set((s) => ({ open: !s.open })),
        close: () => set({ open: false }),
        setInput: (value) => set({ input: value }),

        reset: () => {
          controller?.abort();
          controller = null;
          set({ messages: [], status: "idle", input: "" });
        },

        send: async () => {
          const text = get().input.trim();
          // Ignore empty submits and re-entrancy while a reply streams.
          if (text === "" || get().status === "streaming") return;

          controller?.abort();
          controller = new AbortController();
          const { signal } = controller;

          const userMessage: ChatMessage = { role: "user", content: text };
          // Push the user turn + an empty assistant turn we stream into; the
          // assistant message is the last element from here on.
          set((s) => ({
            messages: [
              ...s.messages,
              userMessage,
              { role: "assistant", content: "" },
            ],
            input: "",
            status: "streaming",
          }));

          // Ground the reply in what the visitor has discovered in the world.
          // chapterStore is a plain singleton (no three/fiber), so reading it
          // here keeps the chat out of the 3D bundle. On flat routes this is
          // just the persisted/empty array.
          const collectedBeacons = chapterStore.getState().collectedBeacons;

          try {
            let failed = false;
            for await (const event of streamChat(
              {
                // Role + content only — citations/booking are UI, not prompt.
                messages: get()
                  .messages.slice(0, -1)
                  .map((m) => ({ role: m.role, content: m.content })),
                context: { collectedBeacons },
              },
              signal,
            )) {
              if (signal.aborted) return;
              if (event.type === "error") failed = true;
              set((s) => {
                const messages = s.messages.slice();
                const last = messages[messages.length - 1];
                if (last && last.role === "assistant") {
                  messages[messages.length - 1] = foldAssistantEvent(
                    last,
                    event,
                  );
                }
                return { messages };
              });
            }
            if (signal.aborted) return;
            set({ status: failed ? "error" : "idle" });
          } catch {
            if (signal.aborted) return;
            // Replace the (possibly empty) assistant turn with a fallback line.
            set((s) => {
              const messages = s.messages.slice();
              const last = messages[messages.length - 1];
              if (last && last.role === "assistant") {
                messages[messages.length - 1] = {
                  role: "assistant",
                  content: ERROR_FALLBACK,
                };
              }
              return { messages, status: "error" };
            });
          } finally {
            if (controller?.signal === signal) controller = null;
          }
        },
      };
    },
    {
      name: "velocity-chat",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : localStorage,
      ),
      partialize: (s) => ({
        messages: s.messages.slice(-PERSISTED_MESSAGES),
      }),
    },
  ),
);
