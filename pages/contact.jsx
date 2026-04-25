/**
 * Contact Page
 *
 * Editorial Cool redesign — centered section header, massive serif title,
 * supernova-gradient accent, 4-card social grid with rim-light.
 *
 * Data: fetches /api/contact for emailAddress + socialMediaLinks.
 */

import { useEffect, useRef, useState } from "react";
import SEO from "@/components/SEO";
import { trackExternalLink } from "@/lib/analytics";
import { getPrefersReducedMotion } from "@/lib/hooks";

function buildSocialCards(contactData) {
  if (!contactData) return [];
  const links = contactData.socialMediaLinks || {};
  const email = contactData.emailAddress;

  return [
    email && {
      key: "email",
      label: "Email",
      handle: email,
      href: `mailto:${email}`,
      external: false,
    },
    links.github && {
      key: "github",
      label: "GitHub",
      handle: links.github.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      href: links.github,
      external: true,
    },
    links.linkedIn && {
      key: "linkedin",
      label: "LinkedIn",
      handle: links.linkedIn.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      href: links.linkedIn,
      external: true,
    },
    links.handshake && {
      key: "handshake",
      label: "Handshake",
      handle: links.handshake
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, ""),
      href: links.handshake,
      external: true,
    },
    links.X && {
      key: "x",
      label: "X",
      handle: links.X.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      href: links.X,
      external: true,
    },
  ].filter(Boolean);
}

export default function ContactPage() {
  const [contactData, setContactData] = useState(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/contact");
        if (response.ok) {
          setContactData(await response.json());
        }
      } catch (_error) {
        /* silent */
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;
    const reduce = getPrefersReducedMotion();
    const reveals = sectionRef.current.querySelectorAll(".reveal");
    reveals.forEach((el, i) => {
      if (reduce) {
        el.classList.add("in");
      } else {
        setTimeout(() => el.classList.add("in"), 80 + i * 120);
      }
    });
  }, [contactData]);

  const cards = buildSocialCards(contactData);

  return (
    <>
      <SEO
        title="Contact - Josh Lowe"
        description="Get in touch — project work, research collaborations, or just to trade notes on ML."
        path="/contact"
      />

      <section
        ref={sectionRef}
        id="contact"
        className="section"
        style={{ padding: "160px 0" }}
      >
        <div className="container">
          <div
            className="reveal"
            style={{ textAlign: "center", maxWidth: 1100, margin: "0 auto" }}
          >
            <div
              className="eyebrow"
              style={{ justifyContent: "center", marginBottom: 32 }}
            >
              <span className="num">04</span>
              <span className="bar" />
              <span>Contact</span>
            </div>
            <h1
              className="display"
              style={{
                fontSize: "clamp(56px, 8vw, 132px)",
                margin: 0,
                lineHeight: 0.96,
              }}
            >
              <span style={{ color: "var(--ink-100)" }}>Let&apos;s build</span>
              <br />
              <em className="italic" style={{ color: "var(--ink-80)" }}>
                something
              </em>{" "}
              <span className="sn-gradient">together.</span>
            </h1>
            <p
              style={{
                fontSize: 19,
                color: "var(--ink-70)",
                lineHeight: 1.6,
                maxWidth: 580,
                margin: "44px auto 64px",
                textWrap: "pretty",
              }}
            >
              Have a project in mind, or just want to trade notes on ML
              research? I read every message.
            </p>
          </div>

          <div
            className="reveal"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
              maxWidth: 1200,
              margin: "0 auto",
            }}
            data-contact
          >
            {cards.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  color: "var(--ink-60)",
                  padding: 40,
                }}
              >
                Loading contact channels…
              </div>
            ) : (
              cards.slice(0, 4).map((card) => (
                <a
                  key={card.key}
                  href={card.href}
                  onClick={() =>
                    card.external && trackExternalLink(card.label, card.href)
                  }
                  target={card.external ? "_blank" : undefined}
                  rel={card.external ? "noopener noreferrer" : undefined}
                  className="card card-hover"
                  style={{
                    padding: 28,
                    display: "flex",
                    flexDirection: "column",
                    gap: 24,
                    justifyContent: "space-between",
                    minHeight: 180,
                    position: "relative",
                    textDecoration: "none",
                  }}
                >
                  <div>
                    <div className="label-mono" style={{ marginBottom: 10 }}>
                      {card.label}
                    </div>
                    <div
                      className="display"
                      style={{
                        fontSize: 20,
                        color: "var(--ink-100)",
                        fontWeight: 400,
                        wordBreak: "break-word",
                        lineHeight: 1.2,
                      }}
                    >
                      {card.handle}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontStyle: "italic",
                        color: "var(--sn-pink)",
                        fontSize: 22,
                      }}
                    >
                      →
                    </span>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 880px) {
          [data-contact] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 560px) {
          [data-contact] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
