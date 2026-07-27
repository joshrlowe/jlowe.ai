"use client";

import Link from "next/link";

/**
 * The diegetic hold card shown over the in-transit scene — the default `/world`
 * view while no chapter is registered (the driving world retired to the
 * standalone jlowe-world repo; the Anchorage space world is under
 * construction). A small DOM overlay in the site's HUD typography; only the
 * flat-site link takes pointer events.
 */
export function TransitNotice() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center px-6">
      <div className="max-w-sm rounded-lg border border-border/60 bg-background/70 px-6 py-4 text-center backdrop-blur">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-primary">
          New sector charting
        </p>
        <p className="mt-2 font-mono text-sm">
          Chapter 2: Escape Velocity — inbound.
        </p>
        <Link
          href="/"
          className="pointer-events-auto mt-3 inline-block text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          Back to the flat site →
        </Link>
      </div>
    </div>
  );
}
