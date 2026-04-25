/**
 * HeroSection.jsx
 *
 * Editorial Cool redesign — massive serif display with supernova-gradient accent,
 * availability chip, subrole paragraph, CTA pair, specialty row.
 *
 * Data contract:
 * - props.data: Welcome row (name, briefBio, callToAction)
 * - props.homeContent: PageContent.home JSON (heroFocus, primaryCta, secondaryCta, techBadges, subrole)
 *   Falls back to design defaults for any unset field.
 */

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { getPrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { trackCtaClick } from "@/lib/analytics";

export default function HeroSection({ data, homeContent }) {
  const [mounted, setMounted] = useState(false);
  const [animationReady, setAnimationReady] = useState(false);

  const sectionRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const hasPlayed = sessionStorage.getItem("introAnimationPlayed") === "true";
    if (hasPlayed) {
      setAnimationReady(true);
    } else {
      const timer = setTimeout(() => setAnimationReady(true), 3300);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!mounted || !animationReady || !sectionRef.current) return;
    const reveals = Array.from(
      sectionRef.current.querySelectorAll(".reveal"),
    );

    if (getPrefersReducedMotion()) {
      reveals.forEach((el) => el.classList.add("in"));
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    reveals.forEach((el, i) => {
      el.classList.add("in");
      tl.fromTo(
        el,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9 },
        i === 0 ? 0 : "-=0.65",
      );
    });

    return () => tl.kill();
  }, [mounted, animationReady]);

  // Data with fallbacks matching the design language
  const focus = homeContent?.heroFocus || "privacy-preserving ML";
  const subroleLead =
    homeContent?.subroleLead || data?.subrole || "MSCS student";
  const subroleBody =
    homeContent?.subroleBody ||
    "at UCF, researching privacy-preserving ML at the AI MIND Lab. Building production intelligence for teams who need results, not prototypes.";

  const primaryCta = homeContent?.primaryCta || {
    text: "Let's talk",
    href: "/contact",
  };
  const secondaryCta = homeContent?.secondaryCta || {
    text: "See the work",
    href: "/projects",
  };

  const techBadges =
    homeContent?.techBadges?.length > 0
      ? homeContent.techBadges
      : [
          { name: "Python" },
          { name: "PyTorch" },
          { name: "AWS" },
          { name: "Next.js" },
          { name: "React.js" },
          { name: "Flask" },
        ];

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative min-h-screen flex items-center"
      style={{ padding: "160px 0 100px" }}
      aria-label="Hero section"
    >
      <div className="container" style={{ width: "100%" }}>
        <div style={{ maxWidth: 1100 }}>
          {/* Availability chip */}
          <div
            className="reveal"
            style={{ marginBottom: 44 }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 16px 9px 14px",
                border: "1px solid var(--rule-mid)",
                borderRadius: 999,
                fontSize: 13,
                color: "var(--ink-80)",
                background: "rgba(10,10,14,0.5)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
              }}
            >
              <span className="live-dot" />
              <span style={{ color: "var(--ink-60)" }}>Currently</span>
              <span style={{ color: "var(--ink-100)" }}>{focus}</span>
            </span>
          </div>

          {/* Massive serif display */}
          <h1
            className="reveal display"
            style={{
              fontSize: "clamp(64px, 11vw, 176px)",
              margin: 0,
              marginBottom: 36,
              lineHeight: 0.92,
            }}
          >
            <span style={{ color: "var(--ink-100)" }}>Building</span>{" "}
            <em style={{ color: "var(--ink-80)" }}>what&apos;s</em>
            <br />
            <span className="sn-gradient">next</span>
            <span style={{ color: "var(--ink-100)" }}>.</span>
          </h1>

          {/* Subrole — serif italic lead-in + role */}
          <div
            className="reveal"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(18px, 1.5vw, 22px)",
              color: "var(--ink-70)",
              lineHeight: 1.5,
              marginBottom: 52,
              maxWidth: 720,
              textWrap: "pretty",
              fontWeight: 400,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--ink-90)",
                fontSize: "1.1em",
              }}
            >
              {subroleLead}
            </span>{" "}
            {subroleBody}
          </div>

          {/* CTAs */}
          <div
            className="reveal"
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 72,
            }}
          >
            <a
              href={primaryCta.href}
              onClick={() => trackCtaClick("primary", primaryCta.href)}
              className="btn btn-primary"
            >
              {primaryCta.text}
              <span style={{ fontSize: 14 }}>→</span>
            </a>
            <a
              href={secondaryCta.href}
              onClick={() => trackCtaClick("secondary", secondaryCta.href)}
              className="btn btn-ghost"
            >
              {secondaryCta.text}
            </a>
          </div>

          {/* Specialty row */}
          <div
            className="reveal"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              paddingTop: 28,
              borderTop: "1px solid var(--rule)",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--ink-50)",
              }}
            >
              Specialties
            </span>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {techBadges.map((t, i) => (
                <span key={t.name || t} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, color: "var(--ink-80)" }}>
                    {t.name || t}
                  </span>
                  {i < techBadges.length - 1 && (
                    <span style={{ color: "var(--ink-30)" }}>·</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gentle scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          right: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          opacity: 0.55,
        }}
        aria-hidden="true"
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--ink-60)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            writingMode: "vertical-rl",
          }}
        >
          Scroll
        </span>
        <span
          style={{
            width: 1,
            height: 44,
            background: "linear-gradient(to bottom, var(--ink-50), transparent)",
          }}
        />
      </div>
    </section>
  );
}
