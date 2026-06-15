"use client";

import { MessageCircleIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ChatDock } from "./chat-dock";
import { chatStore } from "./chat-store";
import { useChat } from "./use-chat";

/**
 * Floating launcher present on every route. A fixed bottom-right button that
 * toggles the docked panel; it also renders the dock itself (the dock stays
 * mounted but slides off-screen when closed). The whole tree is pulled in via
 * `next/dynamic(ssr:false)` from the root layout, so none of this — nor the
 * store/transport — lands in any flat route's first-load JS.
 */
export function ChatLauncher() {
  const open = useChat((s) => s.open);

  return (
    <>
      <Button
        size="icon-lg"
        className="fixed right-4 bottom-4 z-50 rounded-full shadow-lg"
        onClick={() => chatStore.getState().toggle()}
        aria-label={open ? "Close chat" : "Ask Josh's digital twin"}
        aria-expanded={open}
      >
        {open ? <XIcon /> : <MessageCircleIcon />}
      </Button>
      <ChatDock />
    </>
  );
}
