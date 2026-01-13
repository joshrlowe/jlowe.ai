/**
 * HeroSection.jsx
 *
 * SUPERNOVA v2.2 - Portfolio-focused Hero
 *
 * Reframed for portfolio positioning (vs pure consulting):
 * - Lead with identity and achievements
 * - Primary CTA: View Projects (portfolio focus)
 * - Secondary CTA: Contact (still available)
 * - Shows what you've built, not just what you offer
 */

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { Button } from "@/components/ui";

const ReactTyped = dynamic(
  () => import("react-typed").then((mod) => mod.ReactTyped),
  {
    ssr: false,
    loading: () => (
      <span className="text-[var(--color-text-secondary)]">I build</span>
    ),
  },
);

export default function HeroSection({ data, contactData: _contactData, homeContent }) {
  const [typingComplete, setTypingComplete] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animationReady, setAnimationReady] = useState(false);

  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const descRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    setMounted(true);

    // Check if intro animation has already played this session
    const hasPlayed = sessionStorage.getItem("introAnimationPlayed") === "true";

    if (hasPlayed) {
      // Start immediately on subsequent visits
      setAnimationReady(true);
    } else {
      // Wait for supernova animation to complete (3.3s) then start typing
      const timer = setTimeout(() => {
        setAnimationReady(true);
      }, 3300);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!mounted || !typingComplete || !animationReady) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      [titleRef, subtitleRef, descRef, ctaRef].forEach((ref) => {
        if (ref.current) {
          gsap.set(ref.current, { opacity: 1, y: 0 });
        }
      });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      titleRef.current,
      { opacity: 0, y: 50, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.9 },
    )
      .fromTo(
        subtitleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7 },
        "-=0.5",
      )
      .fromTo(
        descRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6 },
        "-=0.3",
      )
      .fromTo(
        ctaRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5 },
        "-=0.2",
      );

    return () => tl.kill();
  }, [mounted, typingComplete, animationReady]);

  const name = data?.name || "Josh Lowe";
  const tagline = data?.callToAction || "AI/ML Engineer";
  const bio =
    data?.briefBio ||
    "Building production-grade AI systems and leading engineering teams. MSCS candidate crafting intelligent solutions that drive real-world impact.";

  // Get content from homeContent prop (from database) or use defaults
  // Portfolio-focused: Lead with what you've built
  const typingIntro = homeContent?.typingIntro || "I build...";
  const heroTitle = homeContent?.heroTitle || "production AI systems";
  const _typingStrings =
    homeContent?.typingStrings?.length > 0
      ? homeContent.typingStrings
      : [
        "production AI systems",
        "scalable ML pipelines",
        "full-stack applications",
        "data-driven solutions",
        "intelligent platforms",
      ];

  // Portfolio-first CTAs: Projects primary, Contact secondary
  const primaryCta = homeContent?.primaryCta || {
    text: "View My Work",
    href: "/projects",
  };
  const secondaryCta = homeContent?.secondaryCta || {
    text: "Get in Touch",
    href: "/contact",
  };

  const techBadges =
    homeContent?.techBadges?.length > 0
      ? homeContent.techBadges
      : [
        { name: "Python", color: "#E85D04" },
        { name: "TensorFlow", color: "#FAA307" },
        { name: "React", color: "#4CC9F0" },
        { name: "AWS", color: "#F48C06" },
        { name: "LLMs", color: "#F72585" },
      ];

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-32"
      aria-label="Hero section"
    >
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center">
          {/* Typing intro - starts after stars appear */}
          <p
            className={`text-lg sm:text-xl mb-4 h-8 transition-opacity duration-500 font-light tracking-wide ${animationReady ? "opacity-100" : "opacity-0"
              }`}
            style={{ color: "var(--color-text-secondary)" }}
          >
            {typingComplete ? (
              <span>{typingIntro}</span>
            ) : (
              mounted &&
              animationReady && (
                <ReactTyped
                  strings={[typingIntro]}
                  typeSpeed={60}
                  loop={false}
                  onComplete={() => setTypingComplete(true)}
                  showCursor={true}
                  cursorChar="|"
                />
              )
            )}
          </p>

          {/* Main title - balanced size */}
          <h1
            ref={titleRef}
            className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight transition-opacity duration-300 ${typingComplete ? "" : "opacity-0"
              }`}
            style={{
              background:
                "linear-gradient(135deg, #FAFAFA 0%, #FFBA08 30%, #E85D04 60%, #9D0208 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 0 80px rgba(232, 93, 4, 0.2)",
            }}
          >
            {heroTitle}
          </h1>

          {/* Subtitle / Role - single line, flexible width */}
          <div
            ref={subtitleRef}
            className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-6 transition-opacity duration-300 ${typingComplete ? "" : "opacity-0"
              }`}
          >
            <span
              className="text-xl sm:text-2xl lg:text-3xl font-semibold whitespace-nowrap"
              style={{
                color: "#E85D04",
                textShadow: "0 0 25px rgba(232, 93, 4, 0.35)",
              }}
            >
              {name}
            </span>
            <span
              className="text-xl sm:text-2xl lg:text-3xl hidden sm:inline"
              style={{ color: "rgba(250, 163, 7, 0.4)" }}
            >
              •
            </span>
            <span
              className="text-lg sm:text-xl lg:text-2xl font-light whitespace-nowrap"
              style={{ color: "var(--color-text-primary)" }}
            >
              {tagline}
            </span>
          </div>

          {/* Description */}
          <p
            ref={descRef}
            className={`text-base sm:text-lg lg:text-xl w-full mx-auto mb-10 leading-relaxed transition-opacity duration-300 ${typingComplete ? "" : "opacity-0"
              }`}
            style={{ color: "var(--color-text-secondary)", maxWidth: "80%" }}
          >
            {bio}
          </p>

          {/* CTAs */}
          <div
            ref={ctaRef}
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-opacity duration-300 ${typingComplete ? "" : "opacity-0"
              }`}
          >
            <Button
              href={primaryCta.href}
              variant="primary"
              size="lg"
              magnetic
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              }
            >
              {primaryCta.text}
            </Button>

            <Button href={secondaryCta.href} variant="secondary" size="lg">
              {secondaryCta.text}
            </Button>
          </div>

          {/* Tech badges */}
          <div
            className={`flex flex-wrap items-center justify-center gap-2 mt-12 transition-opacity duration-500 delay-300 ${typingComplete ? "opacity-100" : "opacity-0"
              }`}
          >
            {techBadges.map((tech) => (
              <span
                key={tech.name}
                className="px-3 py-1 text-xs sm:text-sm font-medium rounded-full transition-all duration-300 hover:scale-105"
                style={{
                  background: `${tech.color}15`,
                  color: tech.color,
                  border: `1px solid ${tech.color}30`,
                }}
              >
                {tech.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-500 ${typingComplete ? "opacity-100" : "opacity-0"
          }`}
      >
        <button
          onClick={() => {
            document
              .getElementById("services")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex flex-col items-center gap-2 transition-colors group"
          style={{ color: "var(--color-text-muted)" }}
          aria-label="Scroll to services"
        >
          <span className="text-xs uppercase tracking-[0.15em] font-medium group-hover:text-[#E85D04] transition-colors">
            Explore
          </span>
          <svg
            className="w-4 h-4 animate-bounce group-hover:text-[#E85D04] transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
