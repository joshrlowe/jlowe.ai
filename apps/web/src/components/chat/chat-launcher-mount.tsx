"use client";

import dynamic from "next/dynamic";

// Lazy-mounted on every route so the chat dock, its store, and the streaming
// transport stay out of every flat route's first-load JS (the 2D shell is the
// SEO/budget surface). `ssr: false` requires a Client Component boundary, so —
// like `ToasterMount` for sonner — this thin wrapper owns the dynamic import;
// the launcher (and the dock body it renders) hydrate only after mount.
const ChatLauncher = dynamic(
  () => import("./chat-launcher").then((m) => m.ChatLauncher),
  { ssr: false },
);

export function ChatLauncherMount() {
  return <ChatLauncher />;
}
