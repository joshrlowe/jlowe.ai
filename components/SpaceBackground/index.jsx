/**
 * SpaceBackground — vanilla Three.js mount for the editorial-cool supernova.
 * Ports design-reference/src/supernova.js into the project; no @react-three/fiber.
 *
 * Listens for the supernova:complete CustomEvent and broadcasts the existing
 * `introAnimationComplete` event so HeroSection's reveal gate continues to work.
 */

import { useEffect, useRef, useState } from "react";

export default function SpaceBackground() {
  const mountRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mountRef.current) return;

    let cleanup = () => {};
    let cancelled = false;

    // Bridge the new "supernova:complete" event into the legacy
    // "introAnimationComplete" event the rest of the app already listens for.
    const onComplete = () => {
      try {
        sessionStorage.setItem("introAnimationPlayed", "true");
      } catch (_e) {
        /* sessionStorage might be blocked */
      }
      window.dispatchEvent(new CustomEvent("introAnimationComplete"));
    };
    window.addEventListener("supernova:complete", onComplete);

    // If the intro has already played this session, the imported scene
    // checks window.__SN_TWEAKS.disableEvent and skips straight to ambient.
    const hasPlayed =
      typeof window !== "undefined" &&
      sessionStorage.getItem("introAnimationPlayed") === "true";
    if (hasPlayed) {
      window.__SN_TWEAKS = { ...(window.__SN_TWEAKS || {}), disableEvent: true };
      // Fire the bridge event immediately so the gate doesn't wait.
      window.dispatchEvent(new CustomEvent("introAnimationComplete"));
    }

    // Dynamic import keeps the ~35 KB scene + Three.js out of the SSR bundle.
    import("./supernovaScene").then(({ initSupernova }) => {
      if (cancelled || !mountRef.current) return;
      cleanup = initSupernova(mountRef.current) || (() => {});
    });

    return () => {
      cancelled = true;
      cleanup();
      window.removeEventListener("supernova:complete", onComplete);
    };
  }, [mounted]);

  if (!mounted) {
    return <div className="fixed inset-0 z-0 bg-black" aria-hidden="true" />;
  }

  return (
    <div
      ref={mountRef}
      id="supernova-canvas"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background: "#000000",
      }}
    />
  );
}
