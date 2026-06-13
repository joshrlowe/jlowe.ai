import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ToasterMount } from "@/components/toaster-mount";
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
        {children}
        <ToasterMount />
      </body>
    </html>
  );
}
