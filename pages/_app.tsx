import { useEffect, useState } from "react";
import Head from "next/head";
import { SessionProvider } from "next-auth/react";
import { useRouter } from "next/router";
import type { AppProps } from "next/app";
import type { Session } from "next-auth";
import { Analytics } from "@vercel/analytics/react";
import { ToastContainer } from "react-toastify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import ToastProvider from "@/components/admin/ToastProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ChatWidget } from "@/components/Chat";
import { personSchema, websiteSchema } from "@/lib/seo/schema";
import {
  spaceGrotesk,
  plusJakartaSans,
  jetbrainsMono,
  oldStandardTT,
  bebasNeue,
  manrope,
} from "@/lib/fonts";

import ScrollProgress from "@/components/ui/ScrollProgress";

import "react-toastify/dist/ReactToastify.css";
import "@/styles/globals.css";
import "@/styles/toast.css";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session?: Session }>) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  // Combine font variables for className
  const fontVariables = `${plusJakartaSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${oldStandardTT.variable} ${bebasNeue.variable} ${manrope.variable}`;

  // Register service worker for PWA and listen for intro complete
  useEffect(() => {
    setMounted(true);

    // Check if not on home page - skip intro animation
    if (router.pathname !== "/") {
      setIntroComplete(true);
    }

    // Check if intro animation has already played this session
    const hasPlayed = sessionStorage.getItem("introAnimationPlayed") === "true";
    if (hasPlayed) {
      setIntroComplete(true);
    }

    // Listen for intro animation complete event
    const handleIntroComplete = () => setIntroComplete(true);
    window.addEventListener("introAnimationComplete", handleIntroComplete);

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Service worker registration failed - silently ignore
      });
    }

    return () => {
      window.removeEventListener("introAnimationComplete", handleIntroComplete);
    };
  }, [router.pathname]);

  // Prefetch pages on hover for better navigation
  useEffect(() => {
    if (!mounted) return;

    const handleLinkMouseEnter = (e: MouseEvent) => {
      const target = e.target as Element | null;
      // Check if target is a DOM element
      if (!target || typeof target.closest !== "function") {
        return;
      }

      const link = target.closest("a");
      if (link && link instanceof HTMLAnchorElement) {
        const href = link.getAttribute("href");
        if (href && href.startsWith("/") && !href.startsWith("/api")) {
          router.prefetch(href);
        }
      }
    };

    document.addEventListener("mouseenter", handleLinkMouseEnter, true);
    return () => {
      document.removeEventListener("mouseenter", handleLinkMouseEnter, true);
    };
  }, [router, mounted]);

  // Check if admin page
  const isAdminPage = router.pathname?.startsWith("/admin") ?? false;

  // /design/* is sandboxed comp space — render bare, no header/footer/chat.
  const isDesignPage = router.pathname?.startsWith("/design") ?? false;

  if (isDesignPage) {
    return (
      <SessionProvider session={session}>
        <Head>
          <title>Design preview — jlowe.ai</title>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
        <div
          className={`${fontVariables} min-h-screen w-full bg-[var(--color-bg-dark)] text-[var(--color-text-primary)]`}
        >
          <Component {...pageProps} />
        </div>
      </SessionProvider>
    );
  }

  // Admin pages layout
  if (isAdminPage) {
    return (
      <SessionProvider session={session}>
        <ToastProvider>
          <Head>
            <title>Admin - Josh Lowe</title>
            <meta name="robots" content="noindex,nofollow" />
          </Head>
          <div className={`${fontVariables} min-h-screen w-full`}>
            <Component {...pageProps} />
          </div>
          <Analytics />
        </ToastProvider>
      </SessionProvider>
    );
  }

  // Default layout for all non-admin pages
  return (
    <ErrorBoundary>
      <SessionProvider session={session}>
        <div
          className={`min-h-screen flex flex-col bg-[var(--color-bg-dark)] text-[var(--color-text-primary)] ${fontVariables}`}
        >
          <Head>
            <title>Josh Lowe</title>
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#bb1313" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          </Head>
          <JsonLd data={websiteSchema} id="website" />
          <JsonLd data={personSchema} id="person" />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--color-primary)] focus:text-white focus:rounded"
          >
            Skip to main content
          </a>
          <ScrollProgress />
          <Header
            style={{
              opacity: introComplete ? 1 : 0,
              transform: introComplete ? "translateY(0)" : "translateY(-100%)",
              transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
              pointerEvents: introComplete ? "auto" : "none",
            }}
          />
          <div className="flex-1 flex flex-col w-full">
            <main id="main-content" className="flex-1 w-full bg-[var(--color-bg-dark)]" role="main">
              <Component {...pageProps} />
            </main>
            <Footer />
          </div>
          <ChatWidget />
          <ToastContainer
            position="bottom-left"
            autoClose={3000}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </div>
        <Analytics />
      </SessionProvider>
    </ErrorBoundary>
  );
}
