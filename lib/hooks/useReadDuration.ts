import { useState, useEffect, useRef, useCallback } from "react";

interface UseReadDurationOptions {
  slug?: string;
  onUnmount?: (data: { slug: string; durationSeconds: number }) => void;
}

interface UseReadDurationResult {
  durationSeconds: number;
  isActive: boolean;
  formattedDuration: string;
}

export function useReadDuration(
  { slug, onUnmount }: UseReadDurationOptions = {},
): UseReadDurationResult {
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateDuration = useCallback(() => {
    if (startTimeRef.current && isActive) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setDurationSeconds(Math.floor(accumulatedTimeRef.current + elapsed));
    }
  }, [isActive]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      if (startTimeRef.current) {
        accumulatedTimeRef.current +=
          (Date.now() - startTimeRef.current) / 1000;
        startTimeRef.current = null;
      }
      setIsActive(false);
    } else {
      startTimeRef.current = Date.now();
      setIsActive(true);
    }
  }, []);

  useEffect(() => {
    if (!slug) {
      return;
    }

    startTimeRef.current = Date.now();
    accumulatedTimeRef.current = 0;
    // Resets active state when slug changes (article navigation).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsActive(true);

    intervalRef.current = setInterval(updateDuration, 1000);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      let finalDuration = accumulatedTimeRef.current;
      if (startTimeRef.current) {
        finalDuration += (Date.now() - startTimeRef.current) / 1000;
      }
      finalDuration = Math.floor(finalDuration);

      if (onUnmount && finalDuration > 0) {
        onUnmount({
          slug,
          durationSeconds: finalDuration,
        });
      }
    };
  }, [slug, onUnmount, updateDuration, handleVisibilityChange]);

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

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

export default useReadDuration;
