/**
 * Premium Font System — Editorial Cool
 *
 * Typography Stack:
 * - Instrument Serif: Editorial display (replaces Space Grotesk)
 * - Inter: Clean body text (replaces Plus Jakarta Sans)
 * - JetBrains Mono: Technical labels
 */
import {
  Inter,
  Instrument_Serif,
  JetBrains_Mono,
} from "next/font/google";

// Body font — clean, highly readable sans-serif
export const inter = Inter({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

// Display font — editorial serif with italic variant
export const instrumentSerif = Instrument_Serif({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif-display",
});

// Code font — technical, readable monospace
export const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-code",
});

// Legacy name aliases — kept so existing imports compile while the
// migration lands. All three point at the new editorial stack.
export const plusJakartaSans = inter;
export const spaceGrotesk = instrumentSerif;
