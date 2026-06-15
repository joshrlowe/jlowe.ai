import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { chapterStore } from "@/components/world/state/chapter-store";

import { type ChatMessage, streamChat } from "./stream";

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
 * Vanilla store for the docked digital-twin chat. Mirrors `chapter-store.ts`:
 * the panel subscribes via `useChat`, while `send()` drives a same-origin
 * streaming POST and appends each text delta to the live assistant message.
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
            for await (const delta of streamChat(
              {
                messages: [...get().messages.slice(0, -1)],
                context: { collectedBeacons },
              },
              signal,
            )) {
              if (signal.aborted) return;
              // Append the delta to the live (last) assistant message.
              set((s) => {
                const messages = s.messages.slice();
                const last = messages[messages.length - 1];
                if (last && last.role === "assistant") {
                  messages[messages.length - 1] = {
                    role: "assistant",
                    content: last.content + delta,
                  };
                }
                return { messages };
              });
            }
            if (signal.aborted) return;
            set({ status: "idle" });
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
