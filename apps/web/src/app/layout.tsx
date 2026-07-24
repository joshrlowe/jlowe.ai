import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ChatLauncherMount } from "@/components/chat/chat-launcher-mount";
import { JsonLd } from "@/components/json-ld";
import { ToasterMount } from "@/components/toaster-mount";
import { personSchema, websiteSchema } from "@/lib/seo/schema";
import { SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/site-config";
import { cn } from "@/lib/utils";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Personal site and AI consultancy of Josh Lowe. Building intelligent systems and production-grade AI applications that solve real-world problems.",
  openGraph: {
    siteName: "jlowe.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  // Brand red; matches the manifest theme_color and the v1 <meta theme-color>.
  themeColor: "#bb1313",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "dark h-full antialiased",
        geistSans.variable,
        geistMono.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <JsonLd data={personSchema()} id="ld-person" />
        <JsonLd data={websiteSchema()} id="ld-website" />
        {children}
        <ChatLauncherMount />
        <ToasterMount />
      </body>
    </html>
  );
}
