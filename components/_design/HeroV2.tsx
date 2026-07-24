/**
 * HeroV2 — Liquid Heat preview hero
 *
 * Replaces HeroSection.tsx with: a full-bleed WebGL fluid heat field,
 * an oversized italic display headline that ignites character-by-
 * character, a Manrope deck that names the real practice, and two
 * CTAs that use *different* microinteractions (one arrow-translate,
 * one ember-fill) to break the "every CTA looks the same" pattern
 * called out in the audit.
 *
 * The headline is sandboxed copy:
 *   "I build AI systems that ship."
 *   — first-person, no comparison to others, no audience pitch.
 * Inflection word: "ship" (the verb the page makes good on).
 */

import Link from "next/link";
import dynamic from "next/dynamic";
import IgnitionText from "./IgnitionText";

const FluidHeatShader = dynamic(() => import("./FluidHeatShader"), {
  ssr: false,
});

interface HeroV2Props {
  /** Real bio from Welcome record — used as a quiet attribution under
   *  the deck, not as the headline. Generic seeded value is OK here
   *  because it's a footnote, not the dominant voice. */
  attribution?: string | null;
}

const HEADLINE = "I build AI systems that ship.";
//                              ^---^   <- "ship" is char index 23..26
const SHIP_RANGE: [number, number] = [23, 26];

export default function HeroV2({ attribution }: HeroV2Props) {
  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-black" aria-label="Hero">
      {/* Full-bleed fluid heat field. Lives behind everything; pointer
          events still pass through to the headline + CTAs. */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <FluidHeatShader intensity={1} />
      </div>

      {/* Top temperature reading — replaces the bouncing-chevron scroll
          cue from the audit kill list. It's environmental (the page is
          stating its own temperature), not "please scroll". */}
      <div className="absolute top-8 left-6 sm:left-10 lg:left-16 z-10">
        <span className="temp-label">T : 3000 K · Fusion</span>
      </div>

      {/* Folio mark — top-right small caps. */}
      <div className="absolute top-8 right-6 sm:right-10 lg:right-16 z-10 text-right">
        <div className="temp-label" style={{ color: "var(--color-text-muted)" }}>
          jlowe.ai · No 01
        </div>
      </div>

      {/* Headline + content column. We avoid the centered, max-w-6xl
          layout from the original hero — content hugs the left edge so
          the right side can crop into the heat field intentionally. */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center pl-6 pr-0 sm:pl-12 lg:pl-20 pt-32 pb-32">
        <div className="max-w-[88rem] w-full">
          <IgnitionText
            as="h1"
            text={HEADLINE}
            inflectionRange={SHIP_RANGE}
            stagger={42}
            startDelay={150}
            className="font-display-italic headline-bleed block"
            style={{
              fontSize: "var(--text-display-xl)",
              lineHeight: 0.92,
              letterSpacing: "-0.025em",
              margin: 0,
            }}
          />

          {/* Deck — Manrope, factual, three concrete claims. No
              consultant-speak, no "passionate about". */}
          <p
            className="font-body-neutral mt-10 sm:mt-14 max-w-[42rem] text-lg sm:text-xl leading-relaxed"
            style={{ color: "rgba(250, 250, 250, 0.78)" }}
          >
            <span style={{ color: "var(--color-stillness)" }}>RAG</span> that ships into production.{" "}
            <span style={{ color: "var(--color-stillness)" }}>Evals</span> that catch regressions
            before users do. Currently benchmarking seven frontier LLMs on automated program repair.
          </p>

          {/* Hairline rule then CTAs. CTAs deliberately use different
              microinteractions: see kill-list audit. */}
          <div className="mt-12 sm:mt-16 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
            <Link
              href="/projects"
              className="group inline-flex items-baseline gap-3 font-display-italic ingot-pulse-on-hover"
              style={{
                color: "var(--color-heat-peak)",
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                lineHeight: 1.1,
                textShadow: "0 0 24px rgba(255, 115, 0, 0.35)",
              }}
            >
              See the work
              {/* Arrow that translates on hover — used here exactly once.
                  The audit allowed this microinteraction at most once;
                  the secondary CTA below uses a different pattern. */}
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-300 group-hover:translate-x-2"
                style={{ fontStyle: "normal" }}
              >
                →
              </span>
            </Link>

            <Link href="/contact" className="ember-fill-cta font-body-neutral">
              Talk to me
            </Link>
          </div>

          {/* Attribution — small, muted. The seeded briefBio lives here
              as a footnote rather than the headline, so its generic
              tone doesn't contaminate the brand voice. */}
          {attribution && (
            <p
              className="font-body-neutral mt-16 max-w-[34rem] text-sm leading-relaxed"
              style={{ color: "var(--color-text-muted)", letterSpacing: "0.01em" }}
            >
              <span className="temp-label" style={{ color: "var(--color-stillness)" }}>
                Note ·{" "}
              </span>
              {attribution}
            </p>
          )}
        </div>
      </div>

      {/* Bottom-edge folio number — temperature continues to fall as the
          eye scrolls. Bebas, condensed, sliced by viewport edge. This is
          the section's exit signature. */}
      <div
        className="absolute bottom-0 right-0 z-0 select-none pointer-events-none"
        style={{
          transform: "translate(8%, 22%)",
          opacity: 0.18,
        }}
      >
        <div
          className="font-condensed"
          style={{
            fontSize: "clamp(10rem, 22vw, 22rem)",
            color: "var(--color-heat-peak)",
            lineHeight: 0.78,
            letterSpacing: "-0.04em",
          }}
        >
          01
        </div>
      </div>
    </section>
  );
}
