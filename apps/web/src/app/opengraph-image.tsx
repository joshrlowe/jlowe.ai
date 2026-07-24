import { ImageResponse } from "next/og";

import { SITE_NAME, SITE_TAGLINE } from "@/lib/site-config";

// Rendered to a static PNG at build time (output: "export" has no request-time
// runtime). This is a minimal branded placeholder — swap in a hero still or
// designed card when artwork is ready. Shared by both the Open Graph and
// Twitter card slots (see twitter-image.tsx).
export const dynamic = "force-static";
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          padding: "80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "16px",
              background: "#bb1313",
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
          <div style={{ color: "#a1a1aa", fontSize: "30px" }}>jlowe.ai</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              color: "#fafafa",
              fontSize: "76px",
              fontWeight: 700,
              lineHeight: 1.05,
            }}
          >
            {SITE_NAME}
          </div>
          <div style={{ color: "#bb1313", fontSize: "40px", fontWeight: 600 }}>
            {SITE_TAGLINE}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
