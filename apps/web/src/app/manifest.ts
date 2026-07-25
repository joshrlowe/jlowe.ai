import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/**
 * Web app manifest, served at /manifest.webmanifest.
 *
 * Ported from v1's public/manifest.json. The maskable/any PNG icon set
 * (icon-192 / icon-512) from v1 has not been re-exported for v2 yet — the
 * SVG icon below covers browsers; add the PNG raster set as a follow-up for
 * full Android/PWA install-icon fidelity.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Josh Lowe — jlowe.ai",
    short_name: "Josh Lowe",
    description: "Personal site and AI consultancy of Josh Lowe.",
    start_url: "/",
    display: "standalone",
    background_color: "#1a1a1a",
    theme_color: "#bb1313",
    orientation: "portrait-primary",
    categories: ["portfolio", "developer", "technology"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
