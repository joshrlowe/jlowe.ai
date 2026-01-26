/**
 * useIsMobile Hook
 *
 * Detects if the viewport is mobile-sized (< 768px).
 * Returns true if the viewport is mobile width.
 *
 * Following Martin Fowler's refactoring principles:
 * - Extract Method: Common pattern extracted to reusable hook
 * - Reactive: Updates when viewport size changes
 *
 * @returns {boolean} Whether the viewport is mobile-sized
 */

import { useState, useEffect } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

/**
 * Returns whether the viewport is mobile-sized
 * Updates reactively when the viewport size changes
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    setIsMobile(mediaQuery.matches);

    const handler = (event) => setIsMobile(event.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

/**
 * Non-reactive version for use in callbacks/effects
 * Returns current value without subscribing to changes
 */
export function getIsMobile() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}
