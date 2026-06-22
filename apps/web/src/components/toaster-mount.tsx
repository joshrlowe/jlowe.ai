"use client";

import dynamic from "next/dynamic";

// Lazy-mount so sonner stays out of every flat route's first-load JS (the 2D
// shell is the SEO surface). Note sonner does NOT replay toasts published
// before it subscribes, so the 2D-tier redirect from /world queues its notice
// (lib/two-d-notice) and the Toaster emits it on mount — see ui/sonner.
const Toaster = dynamic(
  () => import("@/components/ui/sonner").then((m) => m.Toaster),
  { ssr: false },
);

export function ToasterMount() {
  return <Toaster />;
}
