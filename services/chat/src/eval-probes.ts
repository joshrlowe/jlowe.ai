/**
 * Deterministic checkers for nightly live-model probes. No AWS. Fixture
 * strings in eval-probes.test.ts prove the suite fails a bad answer.
 */

import type { CitationItem } from "./citations.js";

const REFUSAL_MARKERS = [
  "don't have",
  "do not have",
  "not in josh",
  "contact page",
  "i don't know",
  "i do not know",
  "isn't in",
  "is not in",
  "don't know",
];

const INVENTION_MARKERS = [
  "founded google",
  "found google",
  "ceo of google",
  "google in 1998",
  "google in 199",
];

export function assertGroundingRefusal(answer: string): void {
  const lower = answer.toLowerCase();
  const invented = INVENTION_MARKERS.filter((m) => lower.includes(m));
  if (invented.length > 0) {
    throw new Error(
      `grounding refusal failed: invented ${JSON.stringify(invented)}`,
    );
  }
  if (!REFUSAL_MARKERS.some((m) => lower.includes(m))) {
    throw new Error(
      "grounding refusal failed: answer neither declined nor pointed at the contact page",
    );
  }
}

const EXPORTED_PREFIXES = ["/projects/", "/articles/", "/about/"];

export function isExportedCitationUrl(url: string): boolean {
  if (!url.startsWith("/") || url.includes("..") || url.includes("//")) {
    return false;
  }
  if (url === "/about/" || url === "/") return true;
  return EXPORTED_PREFIXES.some(
    (prefix) => url.startsWith(prefix) && url.endsWith("/"),
  );
}

export function assertCitationIntegrity(
  text: string,
  items: readonly CitationItem[],
): void {
  const refs = [...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
  const byIndex = new Map(items.map((item) => [item.index, item]));
  for (const n of refs) {
    if (!byIndex.has(n)) {
      throw new Error(`citation [${n}] has no citations-frame item`);
    }
  }
  for (const item of items) {
    if (!isExportedCitationUrl(item.url)) {
      throw new Error(
        `citation [${item.index}] url is not an exported path: ${item.url}`,
      );
    }
  }
}
