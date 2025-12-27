/**
 * Header.jsx
 *
 * SUPERNOVA v2.0 - Navigation Header
 *
 * Features:
 * - Space Grotesk typography
 * - Refined ember color palette
 * - Glass morphism with dark backdrop
 * - Smooth scroll-based transitions
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
    if (href === "/") return router.pathname === "/";
    return router.pathname.startsWith(href);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "py-2 backdrop-blur-xl border-b" : "py-5 bg-transparent"
      }`}
      style={{
        background: isScrolled ? "rgba(0, 0, 0, 0.88)" : "transparent",
        borderColor: isScrolled ? "rgba(232, 93, 4, 0.12)" : "transparent",
        ...style,
      }}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group"
            aria-label="Home"
          >
            {/* Logo mark - custom image */}
            <div className="relative w-18 h-18 rounded-xl overflow-hidden transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(232,93,4,0.45)]">
              <img
                src="/images/logo.png"
                alt="JL Logo"
                className="w-full h-full object-contain"
              />
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-5 py-2.5 text-base font-medium transition-all duration-200 rounded-lg"
                style={{
                  color: isActive(link.href)
                    ? "#E85D04"
                    : "var(--color-text-secondary)",
                  fontFamily: "var(--font-family-base)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(link.href)) {
                    e.currentTarget.style.color = "var(--color-text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(link.href)) {
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                  }
                }}
              >
                {link.label}
                {/* Active indicator */}
                {isActive(link.href) && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                    style={{
                      background: "#E85D04",
                      boxShadow: "0 0 10px rgba(232, 93, 4, 0.7)",
                    }}
                  />
                )}
              </Link>
            ))}

            {/* CTA Button */}
            <Link
              href="/contact"
              className="ml-5 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #E85D04 0%, #C04A03 100%)",
                color: "#FAFAFA",
                boxShadow: "0 0 25px rgba(232, 93, 4, 0.3)",
                fontFamily: "var(--font-family-base)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 0 40px rgba(232, 93, 4, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 0 25px rgba(232, 93, 4, 0.3)";
              }}
            >
              Let's Talk
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
            style={{
              color: "var(--color-text-secondary)",
              background: isMenuOpen ? "rgba(232, 93, 4, 0.1)" : "transparent",
            }}
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <span className="sr-only">Menu</span>
            <div className="relative w-5 h-4">
              <span
                className={`absolute left-0 w-full h-0.5 transition-all duration-300 ${
                  isMenuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                }`}
                style={{ background: isMenuOpen ? "#E85D04" : "currentColor" }}
              />
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-current transition-all duration-300 ${
                  isMenuOpen ? "opacity-0 scale-0" : "opacity-100 scale-100"
                }`}
              />
              <span
                className={`absolute left-0 w-full h-0.5 transition-all duration-300 ${
                  isMenuOpen
                    ? "top-1/2 -translate-y-1/2 -rotate-45"
                    : "bottom-0"
                }`}
                style={{ background: isMenuOpen ? "#E85D04" : "currentColor" }}
              />
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden absolute left-0 right-0 top-full px-4 pb-4 transition-all duration-300 ${
            isMenuOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          <div
            className="rounded-xl p-4 space-y-1 backdrop-blur-xl"
            style={{
              background: "rgba(8, 8, 8, 0.96)",
              border: "1px solid rgba(232, 93, 4, 0.15)",
            }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200"
                style={{
                  color: isActive(link.href)
                    ? "#E85D04"
                    : "var(--color-text-secondary)",
                  background: isActive(link.href)
                    ? "rgba(232, 93, 4, 0.1)"
                    : "transparent",
                  fontFamily: "var(--font-family-base)",
                }}
              >
                {link.label}
              </Link>
            ))}

            <div
              className="pt-3 mt-3"
              style={{ borderTop: "1px solid rgba(232, 93, 4, 0.12)" }}
            >
              <Link
                href="/contact"
                onClick={closeMenu}
                className="block w-full text-center px-5 py-3.5 text-base font-semibold rounded-lg"
                style={{
                  background:
                    "linear-gradient(135deg, #E85D04 0%, #C04A03 100%)",
                  color: "#FAFAFA",
                  fontFamily: "var(--font-family-base)",
                }}
              >
                Let's Talk
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
