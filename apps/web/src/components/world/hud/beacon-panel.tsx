"use client";

import { XIcon } from "lucide-react";
import { useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CORPUS } from "@/data/corpus.generated";

import { chapterStore, useChapter } from "../state/chapter-store";

/**
 * Non-modal portfolio card. A plain slide-in aside (not the Dialog-based Sheet)
 * so it never dims the canvas, traps focus, or steals WASD — you keep driving
 * while you read. Escape or the close button dismisses it. The corpus body is
 * soft-wrapped markdown, so single newlines collapse to spaces.
 */
export function BeaconPanel() {
  const slug = useChapter((s) => s.openBeaconSlug);
  const entry = slug ? CORPUS[slug] : null;
  const open = entry !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") chapterStore.getState().openBeacon(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <aside
      aria-hidden={!open}
      aria-label="Portfolio detail"
      className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col gap-4 overflow-y-auto border-l bg-popover/95 p-6 text-popover-foreground shadow-lg backdrop-blur transition-transform duration-300 ease-out ${
        open
          ? "pointer-events-auto translate-x-0"
          : "pointer-events-none translate-x-full"
      }`}
    >
      {entry ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-lg font-medium">
                {entry.title}
              </h2>
              {entry.role ? (
                <p className="text-sm text-muted-foreground">{entry.role}</p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="-mt-1 -mr-2 shrink-0"
              onClick={() => chapterStore.getState().openBeacon(null)}
              aria-label="Close"
            >
              <XIcon />
            </Button>
          </div>

          {entry.body ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {entry.body.replace(/\n/g, " ")}
            </p>
          ) : null}

          {entry.stack && entry.stack.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {entry.stack.map((s) => (
                <Badge key={s} variant="secondary">
                  {s}
                </Badge>
              ))}
            </div>
          ) : null}

          {entry.outcomes && entry.outcomes.length > 0 ? (
            <ul className="list-disc space-y-1.5 pl-4 text-sm text-muted-foreground">
              {entry.outcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </aside>
  );
}
