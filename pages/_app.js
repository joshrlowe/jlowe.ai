import { useEffect, useState } from "react";
import Head from "next/head";
import { SessionProvider } from "next-auth/react";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToastProvider from "@/components/admin/ToastProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { spaceGrotesk, plusJakartaSans, jetbrainsMono } from "@/lib/fonts";

import ScrollProgress from "@/components/ui/ScrollProgress";

import "react-toastify/dist/ReactToastify.css";
import "@/styles/globals.css";
import "@/styles/toast.css";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  // Combine font variables for className
  const fontVariables = `${plusJakartaSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`;

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
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.log("Service Worker registration failed:", error);
        });
    }

    return () => {
      window.removeEventListener("introAnimationComplete", handleIntroComplete);
    };
  }, [router.pathname]);

  // Prefetch pages on hover for better navigation
  useEffect(() => {
    if (!mounted) return;

    const handleLinkMouseEnter = (e) => {
      // Check if target is a DOM element
      if (!e.target || typeof e.target.closest !== "function") {
        return;
      }

      const link = e.target.closest("a");
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

  // Admin pages layout
  if (isAdminPage) {
    return (
      <SessionProvider session={session}>
        <ToastProvider>
          <Head>
            <title>Admin - Josh Lowe</title>
          </Head>
          <div className={`${fontVariables} min-h-screen w-full`}>
            <Component {...pageProps} />
          </div>
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
            <meta
              name="apple-mobile-web-app-status-bar-style"
              content="black-translucent"
            />
          </Head>
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
            <main
              id="main-content"
              className="flex-1 w-full bg-[var(--color-bg-dark)]"
              role="main"
            >
              <Component {...pageProps} />
            </main>
            <Footer />
          </div>
        </div>
      </SessionProvider>
    </ErrorBoundary>
  );
}
