"use client";

import { useEffect, useState } from "react";

interface TypingTaglineProps {
  phrases: readonly string[];
}

const TYPE_MS = 55;
const ERASE_MS = 28;
const HOLD_MS = 1800;

/**
 * Renders the first phrase as complete static text on the server (SEO +
 * no hydration mismatch), then cycles through phrases with a type/erase
 * loop. Stays static when prefers-reduced-motion matches.
 */
export function TypingTagline({ phrases }: TypingTaglineProps) {
  const first = phrases[0] ?? "";
  const [text, setText] = useState(first);

  useEffect(() => {
    if (phrases.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let phraseIndex = 0;
    let charIndex = (phrases[0] ?? "").length;
    let mode: "hold" | "erase" | "type" = "hold";
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = phrases[phraseIndex] ?? "";
      let delay = TYPE_MS;
      if (mode === "hold") {
        mode = "erase";
        delay = HOLD_MS;
      } else if (mode === "erase") {
        if (charIndex > 0) {
          charIndex -= 1;
          delay = ERASE_MS;
        } else {
          phraseIndex = (phraseIndex + 1) % phrases.length;
          mode = "type";
        }
        setText(current.slice(0, charIndex));
      } else {
        const next = phrases[phraseIndex] ?? "";
        if (charIndex < next.length) {
          charIndex += 1;
          setText(next.slice(0, charIndex));
        } else {
          mode = "hold";
        }
      }
      timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, HOLD_MS);
    return () => clearTimeout(timer);
  }, [phrases]);

  return (
    // Pure film cobalt with a soft bloom — large display text only (the
    // 4.24:1 ratio on the page bg clears the large-text bar, not small).
    <span
      aria-live="off"
      className="text-cobalt [text-shadow:0_0_24px_rgb(42_99_255/0.55)]"
    >
      {text}
      {phrases.length > 1 ? (
        // Stateless cursor: CSS handles blink + reduced-motion, so SSR and
        // client render identically (no setState-in-effect, no mismatch).
        <span
          aria-hidden
          className="font-light motion-safe:animate-pulse motion-reduce:hidden"
        >
          |
        </span>
      ) : null}
    </span>
  );
}
