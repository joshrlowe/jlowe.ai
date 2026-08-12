import { ImageResponse } from "next/og";

import { SITE_NAME, SITE_TAGLINE } from "@/lib/site-config";

// Rendered to a static PNG at build time (output: "export" has no request-time
// runtime). The card is the site in miniature — deep space (#02030a) under a
// seeded scatter of starlight points, a cobalt bloom rising from the horizon,
// and the monogram + type in the cobalt/starlight system. Shared by both the
// Open Graph and Twitter card slots (see twitter-image.tsx).
export const dynamic = "force-static";
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Fixed star scatter (x, y, size px, opacity) — deterministic output.
const STARS: ReadonlyArray<readonly [number, number, number, number]> = [
  [96, 84, 3, 0.9],
  [228, 210, 2, 0.5],
  [340, 64, 2, 0.6],
  [470, 150, 3, 0.8],
  [610, 90, 2, 0.5],
  [724, 240, 2, 0.6],
  [860, 66, 3, 0.9],
  [944, 180, 2, 0.5],
  [1060, 110, 2, 0.7],
  [1128, 300, 3, 0.6],
  [180, 400, 2, 0.5],
  [420, 340, 2, 0.4],
  [680, 380, 2, 0.5],
  [990, 420, 2, 0.4],
  [1100, 540, 2, 0.5],
  [260, 540, 2, 0.6],
];

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#02030a",
        backgroundImage:
          "radial-gradient(90% 70% at 78% 115%, rgba(42,99,255,0.28) 0%, rgba(10,30,110,0.18) 45%, rgba(2,3,10,0) 75%), radial-gradient(120% 60% at 50% -25%, rgba(10,30,110,0.35) 0%, rgba(2,3,10,0) 65%)",
        padding: "80px",
      }}
    >
      {STARS.map(([x, y, s, o], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x}px`,
            top: `${y}px`,
            width: `${s}px`,
            height: `${s}px`,
            borderRadius: "50%",
            background: "#bcd9ff",
            opacity: o,
          }}
        />
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "16px",
            background: "#02030a",
            backgroundImage:
              "radial-gradient(120% 120% at 50% 40%, rgba(42,99,255,0.6) 0%, rgba(10,30,110,0.4) 50%, rgba(2,3,10,0) 100%)",
            border: "1px solid rgba(188,217,255,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: "38px",
            fontWeight: 700,
          }}
        >
          JL
        </div>
        <div
          style={{
            color: "#a2b6dd",
            fontSize: "28px",
            letterSpacing: "10px",
          }}
        >
          jlowe.ai
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div
          style={{
            color: "#f4f8ff",
            fontSize: "76px",
            fontWeight: 700,
            lineHeight: 1.05,
          }}
        >
          {SITE_NAME}
        </div>
        <div style={{ color: "#bcd9ff", fontSize: "40px", fontWeight: 600 }}>
          {SITE_TAGLINE}
        </div>
      </div>
    </div>,
    size,
  );
}
