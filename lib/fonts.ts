/**
 * Font System
 *
 * SUPERNOVA stack (Space Grotesk / Plus Jakarta / JetBrains Mono) is still
 * loaded on production routes. Liquid Heat additions (Old Standard TT
 * Italic / Bebas Neue / Manrope) ship below for /design/comp; will graduate
 * to production after the comp lands (session 02 — design tokens refresh).
 */
import {
  Space_Grotesk,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
  Old_Standard_TT,
  Bebas_Neue,
  Manrope,
} from "next/font/google";

export const spaceGrotesk = Space_Grotesk({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
});

export const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

export const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

// Liquid Heat — display, italic only. The slant is the point.
export const oldStandardTT = Old_Standard_TT({
  weight: ["400", "700"],
  style: ["italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-old-standard",
});

// Liquid Heat — heavy condensed for folio numerals + temperature labels.
export const bebasNeue = Bebas_Neue({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bebas",
});

// Liquid Heat — neutral grotesk body, supporting role to the italic display.
export const manrope = Manrope({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const roboto = plusJakartaSans;
export const oswald = spaceGrotesk;
export const sourceCodePro = jetbrainsMono;
