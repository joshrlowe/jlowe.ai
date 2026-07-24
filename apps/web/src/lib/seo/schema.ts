/**
 * Reusable schema.org payload builders.
 *
 * Keeps the JSON-LD <script> contents in one place so per-route wiring stays
 * declarative and the sitewide Person / WebSite definitions don't drift.
 *
 * Ported from the v1 Pages Router implementation (lib/seo/schema.ts). The
 * BlogPosting / CreativeWork builders are intentionally omitted here: the v2
 * detail routes (/projects/[slug], /articles/[slug]) do not exist yet
 * (Stage 3.1). Add them alongside those routes when they land.
 */
import type { Person, WebSite, WithContext } from "schema-dts";

import { SITE_NAME, siteUrl } from "@/lib/site-config";

/**
 * Sitewide Person schema. Reflects current bio. Update when role /
 * credentials change.
 */
export function personSchema(): WithContext<Person> {
  const url = siteUrl().origin;
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_NAME,
    url,
    jobTitle: "AI Engineer & Consultant",
    sameAs: [
      "https://github.com/joshrlowe",
      "https://www.linkedin.com/in/joshrlowe",
    ],
  };
}

/**
 * Sitewide WebSite schema. SearchAction is omitted intentionally — we don't
 * expose a structured search query string.
 */
export function websiteSchema(): WithContext<WebSite> {
  const url = siteUrl().origin;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "jlowe.ai",
    url,
    description: "Personal site and AI consultancy of Josh Lowe.",
    publisher: {
      "@type": "Person",
      name: SITE_NAME,
      url,
    },
  };
}
