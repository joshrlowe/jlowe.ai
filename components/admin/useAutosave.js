import { useEffect, useRef } from "react";

export function useAutosave(data, onSave, interval = 30000) {
  const timeoutRef = useRef(null);
  const lastSavedRef = useRef(null);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only autosave if data has changed
    const dataString = JSON.stringify(data);
    if (dataString === lastSavedRef.current) {
      return;
    }

    // Set new timeout
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
