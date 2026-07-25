import { ImageResponse } from "next/og";

// Apple touch icon (opaque PNG, no transparency), rendered to a static file at
// build time. Mirrors the SVG monogram in icon.svg / the brand card.
export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#bb1313",
        color: "#ffffff",
        fontSize: "96px",
        fontWeight: 700,
      }}
    >
      JL
    </div>,
    size,
  );
}
