import { useEffect, useRef } from "react";

type SaveCallback<T> = (data: T) => void | Promise<void>;

export function useAutosave<T>(
  data: T,
  onSave: SaveCallback<T>,
  interval = 30000,
): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const dataString = JSON.stringify(data);
    if (dataString === lastSavedRef.current) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      if (onSave && typeof onSave === "function") {
        onSave(data);
        lastSavedRef.current = dataString;
      }
    }, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave, interval]);
}
