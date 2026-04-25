/**
 * Header.jsx
 *
 * Editorial Cool redesign — fixed header with scroll-triggered backdrop,
 * serif wordmark, mono-labeled nav, ink palette.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Header({ style = {} }) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/projects", label: "Projects" },
    { href: "/articles", label: "Articles" },
    { href: "/contact", label: "Contact" },
  ];

  const isActive = (href) => {
    const pathname = router?.pathname || "";
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        paddingTop: isScrolled ? 12 : 20,
        paddingBottom: isScrolled ? 12 : 20,
        background: isScrolled ? "rgba(0, 0, 0, 0.82)" : "transparent",
        borderBottom: isScrolled
          ? "1px solid var(--rule)"
          : "1px solid transparent",
        backdropFilter: isScrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: isScrolled ? "blur(16px)" : "none",
        ...style,
      }}
    >
      <nav className="container">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          {/* Wordmark */}
          <Link
            href="/"
            aria-label="Home"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              textDecoration: "none",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 30% 30%, #FFFFFF 0%, #DBEAFE 22%, #22D3EE 48%, #3B82F6 80%, #0a1428 100%)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.18)",
                flexShrink: 0,
              }}
            />
            <div>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 18,
                  color: "var(--ink-100)",
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                }}
              >
                Josh Lowe
              </span>
            </div>
          </Link>

          {/* Desktop navigation */}
          <div
            className="hidden md:flex"
            style={{ alignItems: "center", gap: 28 }}
          >
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: isActive(link.href) ? "var(--ink-100)" : "var(--ink-60)",
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "color 0.3s var(--ease-out-expo)",
                  paddingBottom: 4,
                  borderBottom: isActive(link.href)
                    ? "1px solid var(--sn-cyan-hi)"
                    : "1px solid transparent",
                }}
              >
                <span
                  style={{
                    color: isActive(link.href)
                      ? "var(--sn-fuchsia)"
                      : "var(--ink-40)",
                    fontSize: 10,
                  }}
                >
                  0{i + 1}
                </span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
            style={{
              position: "relative",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isMenuOpen
                ? "rgba(255,255,255,0.06)"
                : "transparent",
              border: "1px solid var(--rule)",
              borderRadius: 8,
              color: "var(--ink-80)",
            }}
          >
            <span className="sr-only">Menu</span>
            <div style={{ position: "relative", width: 18, height: 14 }}>
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: isMenuOpen ? "50%" : 0,
                  width: "100%",
                  height: 1.5,
                  background: "currentColor",
                  transition: "all 0.3s var(--ease-out-expo)",
                  transform: isMenuOpen
                    ? "translateY(-50%) rotate(45deg)"
                    : "none",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  width: "100%",
                  height: 1.5,
                  background: "currentColor",
                  transition: "all 0.3s var(--ease-out-expo)",
                  transform: "translateY(-50%)",
                  opacity: isMenuOpen ? 0 : 1,
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: isMenuOpen ? "50%" : "auto",
                  bottom: isMenuOpen ? "auto" : 0,
                  width: "100%",
                  height: 1.5,
                  background: "currentColor",
                  transition: "all 0.3s var(--ease-out-expo)",
                  transform: isMenuOpen
                    ? "translateY(-50%) rotate(-45deg)"
                    : "none",
                }}
              />
            </div>
          </button>
        </div>

        {/* Mobile navigation */}
        <div
          className="md:hidden"
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: "100%",
            paddingTop: 8,
            transition: "all 0.3s var(--ease-out-expo)",
            opacity: isMenuOpen ? 1 : 0,
            transform: isMenuOpen ? "translateY(0)" : "translateY(-8px)",
            pointerEvents: isMenuOpen ? "auto" : "none",
          }}
        >
          <div
            className="card"
            style={{
              padding: 8,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              background: "rgba(5, 7, 10, 0.96)",
            }}
          >
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 8,
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: isActive(link.href)
                    ? "var(--ink-100)"
                    : "var(--ink-70)",
                  background: isActive(link.href)
                    ? "rgba(255,255,255,0.04)"
                    : "transparent",
                  textDecoration: "none",
                }}
              >
                <span
                  style={{
                    color: isActive(link.href)
                      ? "var(--sn-fuchsia)"
                      : "var(--ink-40)",
                    fontSize: 10,
                  }}
                >
                  0{i + 1}
                </span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
