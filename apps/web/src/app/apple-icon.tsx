import { ImageResponse } from "next/og";

// Apple touch icon (opaque PNG, no transparency), rendered to a static file at
// build time. Mirrors the SVG monogram in icon.svg / the brand card: deep
// space with a cobalt core glow and the white JL monogram.
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
        background: "#02030a",
        backgroundImage:
          "radial-gradient(120% 120% at 50% 42%, rgba(42,99,255,0.55) 0%, rgba(10,30,110,0.35) 45%, rgba(2,3,10,0) 100%)",
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
