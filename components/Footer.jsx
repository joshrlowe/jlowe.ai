/**
 * Footer.jsx
 *
 * SUPERNOVA v2.0 - Footer
 *
 * Features:
 * - Space Grotesk typography
 * - Refined ember color palette
 * - Social links with glow hover effects
 * - Quick navigation
 */

import { useEffect, useState } from "react";
import Link from "next/link";

const STATIC_SOCIAL_ITEMS = [
  { key: "email", label: "Email", icon: "email" },
  { key: "linkedIn", label: "LinkedIn", icon: "linkedin" },
  { key: "github", label: "GitHub", icon: "github" },
  { key: "x", label: "X (Twitter)", icon: "x" },
];

const socialIcons = {
  email: (
    <svg
      className="w-5 h-5"
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
  linkedin: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  github: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
};

export default function Footer() {
  const [contactData, setContactData] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setMounted(true);

    const fetchData = async () => {
      try {
        const response = await fetch("/api/contact");
        if (!response.ok) return;
        const data = await response.json();
        // Only update state if component is still mounted
        if (isMounted) {
          setContactData(data);
        }
      } catch (error) {
        // Silently fail - contact data is optional
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const getHref = (key) => {
    if (!mounted || !contactData) return "#";

    const socialLinks = contactData.socialMediaLinks || {};

    switch (key) {
      case "email":
        return contactData.emailAddress
          ? `mailto:${contactData.emailAddress}`
          : "#";
      case "linkedIn":
        return socialLinks.linkedIn || "#";
      case "github":
        return socialLinks.github || "#";
      case "x":
        return socialLinks.X || "#";
      default:
        return "#";
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="relative z-10 backdrop-blur-xl"
      style={{
        background: "rgba(0, 0, 0, 0.92)",
        borderTop: "1px solid rgba(232, 93, 4, 0.12)",
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-14 mb-14">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl overflow-hidden">
                <img
                  src="/images/logo.png"
                  alt="JL Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span
                  className="text-xl font-semibold tracking-tight"
                  style={{
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-family-heading)",
                  }}
                >
                  Josh Lowe
                </span>
                <span
                  className="block text-xs tracking-wide"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  AI Engineer & Consultant
                </span>
              </div>
            </Link>
            <p
              className="leading-relaxed mb-6"
              style={{
                color: "var(--color-text-secondary)",
                fontFamily: "var(--font-family-base)",
                maxWidth: "80%",
              }}
            >
              Building intelligent systems and production-grade AI applications
              that solve real-world problems.
            </p>

            {/* Social links */}
            <div className="flex gap-3">
              {STATIC_SOCIAL_ITEMS.map((item) => (
                <a
                  key={item.key}
                  href={getHref(item.key)}
                  target={item.key !== "email" ? "_blank" : undefined}
                  rel={item.key !== "email" ? "noopener noreferrer" : undefined}
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: "rgba(232, 93, 4, 0.08)",
                    border: "1px solid rgba(232, 93, 4, 0.15)",
                    color: "var(--color-text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(232, 93, 4, 0.15)";
                    e.currentTarget.style.borderColor = "#E85D04";
                    e.currentTarget.style.color = "#E85D04";
                    e.currentTarget.style.boxShadow =
                      "0 0 20px rgba(232, 93, 4, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(232, 93, 4, 0.08)";
                    e.currentTarget.style.borderColor =
                      "rgba(232, 93, 4, 0.15)";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  aria-label={item.label}
                >
                  {socialIcons[item.icon]}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-5"
              style={{
                color: "#E85D04",
                fontFamily: "var(--font-family-heading)",
              }}
            >
              Navigation
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About" },
                { href: "/projects", label: "Projects" },
                { href: "/articles", label: "Articles" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors duration-200"
                    style={{
                      color: "var(--color-text-secondary)",
                      fontFamily: "var(--font-family-base)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#E85D04")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color =
                        "var(--color-text-secondary)")
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-5"
              style={{
                color: "#FAA307",
                fontFamily: "var(--font-family-heading)",
              }}
            >
              Services
            </h3>
            <ul className="space-y-3">
              {[
                "AI Strategy",
                "ML Systems",
                "LLM Solutions",
                "Cloud & MLOps",
                "Data Analytics",
              ].map((service) => (
                <li
                  key={service}
                  className="text-sm"
                  style={{
                    color: "var(--color-text-secondary)",
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  {service}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(232, 93, 4, 0.1)" }}
        >
          <p
            className="text-sm"
            style={{
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-family-base)",
            }}
          >
            © {currentYear} Josh Lowe. All rights reserved.
          </p>
          <p
            className="text-sm flex items-center gap-2"
            style={{
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-family-base)",
            }}
          >
            Built with
            <span
              className="inline-flex items-center"
              style={{ color: "#E85D04" }}
            >
              <svg
                className="w-4 h-4 animate-pulse"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            and React
          </p>
        </div>
      </div>
    </footer>
  );
}
