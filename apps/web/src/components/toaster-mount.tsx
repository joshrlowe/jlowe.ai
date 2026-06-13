"use client";

import dynamic from "next/dynamic";

// Lazy-mount so sonner stays out of every flat route's first-load JS (the 2D
// shell is the SEO surface). The toast store is a module singleton, so a toast
// queued before this mounts — e.g. the 2D-tier redirect from /world — still
// renders once the Toaster hydrates.
const Toaster = dynamic(
  () => import("@/components/ui/sonner").then((m) => m.Toaster),
  { ssr: false },
);

export function ToasterMount() {
  return <Toaster />;
}
