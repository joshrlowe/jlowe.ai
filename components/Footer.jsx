/**
 * Footer.jsx
 *
 * Editorial Cool redesign — owner block + navigation + elsewhere links,
 * backdrop-blur on pure black, ink palette, .ulink hovers.
 */

import { useEffect, useState } from "react";
import Link from "next/link";

const DEFAULT_FOOTER_TEXT =
  "Building intelligent systems and production-grade AI applications that solve real-world problems.";
const DEFAULT_FOOTER_TITLE = "AI / ML Engineer";

export default function Footer() {
  const [contactData, setContactData] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const cacheBuster = `?_t=${Date.now()}`;
        const [contactResponse, settingsResponse] = await Promise.all([
          fetch(`/api/contact${cacheBuster}`),
          fetch(`/api/site-settings${cacheBuster}`),
        ]);
        if (contactResponse.ok && isMounted) {
          setContactData(await contactResponse.json());
        }
        if (settingsResponse.ok && isMounted) {
          setSiteSettings(await settingsResponse.json());
        }
      } catch (_error) {
        /* silent */
      }
    };

    fetchData();

    const handleFocus = () => fetchData();
    window.addEventListener("focus", handleFocus);
    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const socialLinks = contactData?.socialMediaLinks || {};
  const email = contactData?.emailAddress;

  const elsewhere = [
    email ? { label: "Email", href: `mailto:${email}` } : null,
    socialLinks.github ? { label: "GitHub", href: socialLinks.github } : null,
    socialLinks.linkedIn
      ? { label: "LinkedIn", href: socialLinks.linkedIn }
      : null,
    socialLinks.X ? { label: "X", href: socialLinks.X } : null,
    socialLinks.handshake
      ? { label: "Handshake", href: socialLinks.handshake }
      : null,
  ].filter(Boolean);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/projects", label: "Projects" },
    { href: "/articles", label: "Articles" },
    { href: "/contact", label: "Contact" },
  ];

  const currentYear = new Date().getFullYear();
  const ownerName = siteSettings?.ownerName || "Josh Lowe";
  const footerTitle = siteSettings?.footerTitle || DEFAULT_FOOTER_TITLE;
  const footerText = siteSettings?.footerText || DEFAULT_FOOTER_TEXT;

  return (
    <footer
      style={{
        position: "relative",
        zIndex: 10,
        borderTop: "1px solid var(--rule)",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "64px 0 40px",
        marginTop: 80,
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 40,
            marginBottom: 56,
          }}
          data-footer
        >
          {/* Owner + bio */}
          <div style={{ gridColumn: "span 2" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 18,
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 30% 30%, #FFFFFF 0%, #DBEAFE 22%, #22D3EE 48%, #3B82F6 80%, #0a1428 100%)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.18)",
                  flexShrink: 0,
                }}
              />
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 18,
                    color: "var(--ink-100)",
                    fontWeight: 400,
                  }}
                >
                  {ownerName}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    color: "var(--ink-60)",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginTop: 2,
                  }}
                >
                  {footerTitle}
                </div>
              </div>
            </div>
            <p
              style={{
                fontSize: 15,
                color: "var(--ink-70)",
                lineHeight: 1.6,
                maxWidth: 460,
                margin: 0,
              }}
            >
              {footerText}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <div className="label-mono" style={{ marginBottom: 16 }}>
              Navigation
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="ulink"
                    style={{ fontSize: 14, color: "var(--ink-80)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Elsewhere */}
          <div>
            <div className="label-mono" style={{ marginBottom: 16 }}>
              Elsewhere
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {elsewhere.length === 0 ? (
                <li style={{ fontSize: 14, color: "var(--ink-50)" }}>
                  Loading…
                </li>
              ) : (
                elsewhere.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="ulink"
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel={
                        link.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      style={{ fontSize: 14, color: "var(--ink-80)" }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Bottom rule + copyright */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid var(--rule)",
            paddingTop: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--ink-50)",
              letterSpacing: "0.08em",
            }}
          >
            © {currentYear} {ownerName}
          </span>
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 14,
              color: "var(--ink-60)",
            }}
          >
            Built with care in Orlando, FL.
          </span>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 780px) {
          [data-footer] {
            grid-template-columns: 1fr !important;
          }
          [data-footer] > :global(*:first-child) {
            grid-column: span 1 !important;
          }
        }
      `}</style>
    </footer>
  );
}
