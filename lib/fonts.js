/**
 * Premium Font System - SUPERNOVA Theme
 *
 * Typography Stack:
 * - Space Grotesk: Geometric, distinctive headings (replaces Oswald)
 * - Plus Jakarta Sans: Clean, contemporary body text (replaces Roboto)
 * - JetBrains Mono: Technical, readable code
 */
import {
  Space_Grotesk,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";

// Heading font - geometric, modern, distinctive
export const spaceGrotesk = Space_Grotesk({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
});

// Body font - clean, contemporary, highly readable
export const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

// Code font - technical, readable monospace
export const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

// Legacy exports for backwards compatibility during transition
export const roboto = plusJakartaSans;
export const oswald = spaceGrotesk;
export const sourceCodePro = jetbrainsMono;
