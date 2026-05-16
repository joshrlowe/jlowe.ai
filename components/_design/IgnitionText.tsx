/**
 * IgnitionText
 *
 * Splits a string into per-character spans and staggers a CSS keyframe
 * (`liquid-heat-ignite`) across them. Optional `inflectionRange` marks
 * a contiguous span of characters with the fuchsia inflection variant
 * — used once per page, on the most-stressed word in the hero headline.
 *
 * No JS animation library: the stagger is pure CSS animation-delay,
 * which means it's free under prefers-reduced-motion (the keyframe is
 * disabled in globals.css and the chars render in their final state).
 */

import { Fragment, type CSSProperties, type ElementType } from "react";

interface IgnitionTextProps {
  text: string;
  startDelay?: number;
  stagger?: number;
  /** Inclusive char range to ignite as fuchsia inflection, e.g. the
   *  most-stressed word in the headline. Whitespace inside the range
   *  is rendered neutral so the word reads as one hot cluster. */
  inflectionRange?: [number, number];
  className?: string;
  style?: CSSProperties;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
}

export default function IgnitionText({
  text,
  startDelay = 0,
  stagger = 38,
  inflectionRange,
  className,
  style,
  as = "span",
}: IgnitionTextProps) {
  const Tag = as as ElementType;
  const chars = Array.from(text);

  return (
    <Tag className={className} style={style} aria-label={text}>
      <span aria-hidden="true">
        {chars.map((char, i) => {
          const isInflection =
            inflectionRange !== undefined &&
            i >= inflectionRange[0] &&
            i <= inflectionRange[1] &&
            char.trim().length > 0;
          const delay = startDelay + i * stagger;
          return (
            <Fragment key={i}>
              <span
                className={`ignite-char${isInflection ? " is-inflection" : ""}`}
                style={{ animationDelay: `${delay}ms` }}
              >
                {char}
              </span>
            </Fragment>
          );
        })}
      </span>
    </Tag>
  );
}
