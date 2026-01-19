/**
 * Contact Page
 *
 * Contact information with:
 * - Space-themed design
 * - GSAP animations
 * - Social links
 * - Vertical word carousel
 */

import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SEO from "@/components/SEO";
import { trackExternalLink } from "@/lib/analytics";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const DEFAULT_HERO_WORDS = ["Amazing", "Innovative", "Momentous"];

// Enhanced vertical carousel component with GSAP animations
function WordCarousel({ words = DEFAULT_HERO_WORDS }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef(null);
  const currentWordRef = useRef(null);
  const nextWordRef = useRef(null);

  useEffect(() => {
    if (words.length <= 1 || !currentWordRef.current || !nextWordRef.current) return;

    // Set initial state
    gsap.set(nextWordRef.current, { yPercent: 100, opacity: 0 });

    const animate = () => {
      if (isAnimating) return;
      setIsAnimating(true);

      const tl = gsap.timeline({
        onComplete: () => {
          setCurrentIndex(nextIndex);
          setNextIndex((nextIndex + 1) % words.length);
          setIsAnimating(false);
          // Reset positions for next animation
          gsap.set(currentWordRef.current, { yPercent: 0, opacity: 1 });
          gsap.set(nextWordRef.current, { yPercent: 100, opacity: 0 });
        },
      });

      // Animate current word out (slide up and fade)
      tl.to(currentWordRef.current, {
        yPercent: -100,
        opacity: 0,
        duration: 0.5,
        ease: "power2.in",
      });

      // Animate next word in (slide up from below)
      tl.to(
        nextWordRef.current,
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.3" // Overlap for smoother transition
      );
    };

    const interval = setInterval(animate, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [words.length, nextIndex, isAnimating]);

  // Update next index when current changes
  useEffect(() => {
    setNextIndex((currentIndex + 1) % words.length);
  }, [currentIndex, words.length]);

  return (
    <span
      ref={containerRef}
      className="inline-block relative overflow-hidden"
      style={{ 
        height: "1.3em", 
        verticalAlign: "bottom",
        minWidth: "180px",
      }}
    >
      {/* Current word */}
      <span
        ref={currentWordRef}
        className="absolute inset-0 flex items-center justify-start"
        style={{
          background: "linear-gradient(135deg, #E85D04 0%, #FFBA08 50%, #FAA307 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          textShadow: "0 0 40px rgba(232, 93, 4, 0.4)",
          fontWeight: "inherit",
        }}
      >
        {words[currentIndex]}
      </span>
      
      {/* Next word (initially hidden below) */}
      <span
        ref={nextWordRef}
        className="absolute inset-0 flex items-center justify-start"
        style={{
          background: "linear-gradient(135deg, #E85D04 0%, #FFBA08 50%, #FAA307 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          textShadow: "0 0 40px rgba(232, 93, 4, 0.4)",
          fontWeight: "inherit",
          opacity: 0,
        }}
      >
        {words[nextIndex]}
      </span>

      {/* Invisible text to maintain width */}
      <span className="invisible" aria-hidden="true">
        {words.reduce((a, b) => (a.length > b.length ? a : b))}
      </span>
    </span>
  );
}

export default function ContactPage() {
  const [contactData, setContactData] = useState(null);
  const [mounted, setMounted] = useState(false);

  const headerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    setMounted(true);

    const fetchData = async () => {
      try {
        const response = await fetch("/api/contact");
        const data = await response.json();
        setContactData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Get hero words from contact data or use defaults
  const heroWords = contactData?.heroWords || DEFAULT_HERO_WORDS;

  useEffect(() => {
    if (!mounted) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    if (contentRef.current) {
      tl.fromTo(
        contentRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.3 },
      );
    }
  }, [mounted]);

  const socialLinks = contactData?.socialMediaLinks || {};

  const socialItems = [
    {
      key: "linkedin",
      href: socialLinks.linkedIn || "#",
      label: "LinkedIn",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      color: "linkedin",
    },
    {
      key: "github",
      href: socialLinks.github || "#",
      label: "GitHub",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ),
      color: "github",
    },
    {
      key: "twitter",
      href: socialLinks.X || "#",
      label: "X (Twitter)",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: "x",
    },
    {
      key: "email",
      href: contactData?.emailAddress
        ? `mailto:${contactData.emailAddress}`
        : "#",
      label: "Email",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      color: "email",
    },
  ];

  // Brand-specific color schemes
  const colorMap = {
    linkedin: {
      bg: "rgba(10, 102, 194, 0.1)",
      border: "rgba(10, 102, 194, 0.3)",
      text: "#0A66C2",
      hover: "#0A66C2",
    },
    github: {
      bg: "rgba(36, 41, 47, 0.1)",
      border: "rgba(36, 41, 47, 0.3)",
      text: "#8B949E",
      hover: "#F0F6FC",
    },
    x: {
      bg: "rgba(255, 255, 255, 0.05)",
      border: "rgba(255, 255, 255, 0.15)",
      text: "#E7E9EA",
      hover: "#FFFFFF",
    },
    email: {
      bg: "rgba(232, 93, 4, 0.08)",
      border: "rgba(232, 93, 4, 0.2)",
      text: "#E85D04",
      hover: "#E85D04",
    },
  };

  if (!contactData) {
    return (
      <>
        <SEO
          title="Contact - Josh Lowe"
          description="Get in touch with Josh Lowe for AI consulting and engineering projects."
        />
        <div className="section flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <span className="text-[var(--color-text-muted)]">
              Loading contact info...
            </span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Contact - Josh Lowe"
        description="Get in touch with Josh Lowe for AI consulting, machine learning projects, and full-stack development."
        url="https://jlowe.ai/contact"
      />

      <div className="section relative z-10 min-h-screen">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div ref={headerRef} className="text-center mb-16">
            <span className="badge badge-accent mb-4">Get in Touch</span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 font-[family-name:var(--font-oswald)]">
              Let's Build Something{" "}
              {mounted && <WordCarousel words={heroWords} />}
            </h1>
            <p
              className="text-lg text-[var(--color-text-secondary)] mx-auto"
              style={{ maxWidth: "80%" }}
            >
              Ready to bring AI to your business? I'd love to hear about your
              project and explore how we can work together.
            </p>
          </div>

          {/* Content */}
          <div
            ref={contentRef}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Contact Card */}
            <div className="glass-card p-8">
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 font-[family-name:var(--font-oswald)]">
                Contact Information
              </h2>

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                    Name
                  </label>
                  <p className="text-lg text-[var(--color-text-primary)]">
                    Josh Lowe
                  </p>
                </div>

                {/* Email */}
                {contactData.emailAddress && (
                  <div>
                    <label className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                      Email
                    </label>
                    <a
                      href={`mailto:${contactData.emailAddress}`}
                      className="text-lg text-[var(--color-primary)] hover:underline"
                    >
                      {contactData.emailAddress}
                    </a>
                  </div>
                )}

                {/* Phone */}
                {contactData.phoneNumber && (
                  <div>
                    <label className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                      Phone
                    </label>
                    <a
                      href={`tel:${contactData.phoneNumber}`}
                      className="text-lg text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      {contactData.phoneNumber}
                    </a>
                  </div>
                )}

                {/* Location */}
                {contactData.address && (
                  <div>
                    <label className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                      Location
                    </label>
                    <p className="text-lg text-[var(--color-text-primary)]">
                      {contactData.address}
                    </p>
                  </div>
                )}

                {/* Availability */}
                {contactData.availability && (
                  <div className="pt-4 border-t border-[var(--color-border)]">
                    <label className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                      Availability
                    </label>
                    <p className="text-[var(--color-text-primary)]">
                      {typeof contactData.availability === "object"
                        ? contactData.availability.workingHours
                        : contactData.availability}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2 italic">
                      Best reached via email or LinkedIn message.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="glass-card p-8">
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 font-[family-name:var(--font-oswald)]">
                Connect With Me
              </h2>

              <div className="space-y-4">
                {socialItems.map((item) => {
                  const colors = colorMap[item.color];
                  const isDisabled = item.href === "#";

                  return (
                    <a
                      key={item.key}
                      href={item.href}
                      target={
                        item.href.startsWith("mailto:") ? undefined : "_blank"
                      }
                      rel={
                        item.href.startsWith("mailto:")
                          ? undefined
                          : "noopener noreferrer"
                      }
                      onClick={(e) => {
                        if (isDisabled) {
                          e.preventDefault();
                        } else {
                          trackExternalLink(item.key, item.href);
                        }
                      }}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                        isDisabled
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:scale-[1.02] hover:shadow-lg"
                      }`}
                      style={{
                        background: colors.bg,
                        borderColor: colors.border,
                      }}
                      aria-label={item.label}
                    >
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">
                          {item.label}
                        </p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          {item.key === "email"
                            ? "Send me an email"
                            : `Connect on ${item.label}`}
                        </p>
                      </div>
                      <svg
                        className="w-5 h-5 ml-auto text-[var(--color-text-muted)]"
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
                    </a>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2 text-[var(--color-success)] mb-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                  <span className="text-sm font-medium">
                    Available for new projects
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Currently accepting new consulting engagements and
                  collaboration opportunities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
