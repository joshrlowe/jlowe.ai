import { useEffect, useState } from "react";
import Head from "next/head";
import { SessionProvider } from "next-auth/react";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToastProvider from "@/components/admin/ToastProvider";
import ErrorBoundary from "@/components/ErrorBoundary";

import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import styles from "@/styles/Layout.module.css";
import "@/styles/globals.css";
import "@/styles/design-system.css";
import "@/styles/admin-components.css";
import "@/styles/Skeleton.module.css";
import "@/styles/toast.css";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Register service worker for PWA
  useEffect(() => {
    setMounted(true);
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
  }, []);

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

  // Check if admin page - router.pathname is available during SSR in Next.js
  // Always render the same structure based on pathname to prevent hydration mismatch
  const isAdminPage = router.pathname?.startsWith("/admin") ?? false;

  // Admin pages layout
  if (isAdminPage) {
    return (
      <SessionProvider session={session}>
        <ToastProvider>
          <Head>
            <title>Admin - Josh Lowe</title>
          </Head>
          <Component {...pageProps} />
        </ToastProvider>
      </SessionProvider>
    );
  }

  // Default layout for all non-admin pages
  // Header and Footer are client-only to prevent hydration issues
  return (
    <ErrorBoundary>
      <SessionProvider session={session}>
        <div className={styles.container}>
          <Head>
            <title>Josh Lowe</title>
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#bb1313" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          </Head>
          <a href="#main-content" className={styles.skipLink} suppressHydrationWarning>
            Skip to main content
          </a>
          <Header />
          <div className={styles.contentWrapper}>
            <main id="main-content" className={`${styles.main} darkBackground`} role="main">
              <Component {...pageProps} />
            </main>
            <Footer />
          </div>
        </div>
      </SessionProvider>
    </ErrorBoundary>
  );
}
