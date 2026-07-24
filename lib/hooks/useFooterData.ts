import { useEffect, useState } from "react";
import type { Contact, SiteSettings } from "@/lib/types";

let cachedContact: Contact | null = null;
let cachedSettings: SiteSettings | null = null;
let inFlight: Promise<void> | null = null;

export interface FooterData {
  contact: Contact | null;
  settings: SiteSettings | null;
}

export function useFooterData(): FooterData {
  const [data, setData] = useState<FooterData>({
    contact: cachedContact,
    settings: cachedSettings,
  });

  useEffect(() => {
    if (cachedContact !== null && cachedSettings !== null) {
      setData({ contact: cachedContact, settings: cachedSettings });
      return;
    }
    if (inFlight) {
      inFlight.then(() => {
        setData({ contact: cachedContact, settings: cachedSettings });
      });
      return;
    }
    inFlight = Promise.all([
      fetch("/api/contact").then((r) => (r.ok ? (r.json() as Promise<Contact>) : null)),
      fetch("/api/site-settings").then((r) =>
        r.ok ? (r.json() as Promise<SiteSettings>) : null
      ),
    ])
      .then(([c, s]) => {
        cachedContact = c;
        cachedSettings = s;
        setData({ contact: cachedContact, settings: cachedSettings });
      })
      .catch(() => {
        // Silently fail — footer data is optional; component falls back to defaults.
      })
      .finally(() => {
        inFlight = null;
      });
  }, []);

  return data;
}

// Test-only: clears the module-scope cache so each `it` block starts fresh.
export function __resetFooterDataCacheForTests(): void {
  cachedContact = null;
  cachedSettings = null;
  inFlight = null;
}
