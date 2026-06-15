import { useStore } from "zustand";

import { type ChatState, chatStore } from "./chat-store";

/** Subscribe a component to a slice of the chat store (mirrors `useChapter`). */
export function useChat<T>(selector: (state: ChatState) => T): T {
  return useStore(chatStore, selector);
}
