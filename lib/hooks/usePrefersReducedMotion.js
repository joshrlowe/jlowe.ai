/**
 * usePrefersReducedMotion Hook
 *
 * Detects user's motion preferences for accessibility.
 * Returns true if the user prefers reduced motion.
 *
 * Following Martin Fowler's refactoring principles:
 * - Extract Method: Common pattern extracted to reusable hook
 * - Reactive: Updates when user changes system preferences
 *
 * @returns {boolean} Whether the user prefers reduced motion
 */

import { useState, useEffect } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Returns whether the user prefers reduced motion
 * Updates reactively when the preference changes
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Non-reactive version for use in callbacks/effects
 * Returns current value without subscribing to changes
 */
export function getPrefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

