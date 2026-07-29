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
    // Deep-space palette (see globals.css): splash + chrome match the site
    // background so install/launch surfaces read as the same universe.
    background_color: "#02030a",
    theme_color: "#02030a",
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
