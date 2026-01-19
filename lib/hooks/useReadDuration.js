/**
 * useReadDuration Hook
 *
 * Tracks time spent reading an article.
 * Uses Page Visibility API to pause when tab is inactive.
 * Fires event on unmount/navigation.
 *
 * @param {Object} options - Hook options
 * @param {string} options.slug - Article slug for tracking
 * @param {Function} [options.onUnmount] - Callback with duration data on unmount
 * @returns {Object} Current duration state
 */

import { useState, useEffect, useRef, useCallback } from "react";

export function useReadDuration({ slug, onUnmount } = {}) {
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const startTimeRef = useRef(null);
  const accumulatedTimeRef = useRef(0);
  const intervalRef = useRef(null);

  // Update duration every second when active
  const updateDuration = useCallback(() => {
    if (startTimeRef.current && isActive) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setDurationSeconds(Math.floor(accumulatedTimeRef.current + elapsed));
    }
  }, [isActive]);

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Page is hidden - pause tracking
      if (startTimeRef.current) {
        accumulatedTimeRef.current +=
          (Date.now() - startTimeRef.current) / 1000;
        startTimeRef.current = null;
      }
      setIsActive(false);
    } else {
      // Page is visible - resume tracking
      startTimeRef.current = Date.now();
      setIsActive(true);
    }
  }, []);

  // Initialize tracking
  useEffect(() => {
    if (!slug) {
      return;
    }

    // Start tracking
    startTimeRef.current = Date.now();
    accumulatedTimeRef.current = 0;
    setIsActive(true);

    // Set up interval for updating duration
    intervalRef.current = setInterval(updateDuration, 1000);

    // Add visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      // Cleanup
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Calculate final duration
      let finalDuration = accumulatedTimeRef.current;
      if (startTimeRef.current) {
        finalDuration += (Date.now() - startTimeRef.current) / 1000;
      }
      finalDuration = Math.floor(finalDuration);

      // Fire unmount callback with duration data
      if (onUnmount && finalDuration > 0) {
        onUnmount({
          slug,
          durationSeconds: finalDuration,
        });
      }
    };
  }, [slug, onUnmount, updateDuration, handleVisibilityChange]);

  // Update duration when visibility changes
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(updateDuration, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, updateDuration]);

  return {
    durationSeconds,
    isActive,
    formattedDuration: formatDuration(durationSeconds),
  };
}

/**
 * Format seconds into a human-readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "2m 30s")
 */
function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

export default useReadDuration;

