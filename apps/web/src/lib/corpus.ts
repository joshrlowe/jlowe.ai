// Typed read accessors over the generated corpus module. The corpus is the
// single source of truth (shared with the world's beacons + the chat prompt);
// these helpers give the flat SEO surface the same content without hand-edited
// placeholder data. Never import corpus.generated.ts directly in a page — go
// through here so the shape stays consistent.

import {
  CORPUS,
  CORPUS_SLUGS,
  type CorpusEntry,
} from "@/data/corpus.generated";

export type { CorpusEntry };
export type CorpusKind = CorpusEntry["kind"];

/** All public entries of a kind, in stable (slug-sorted) corpus order. */
export function entriesByKind(kind: CorpusKind): CorpusEntry[] {
  return CORPUS_SLUGS.map((slug) => CORPUS[slug]).filter(
    (entry): entry is CorpusEntry => entry !== undefined && entry.kind === kind,
  );
}

/** A single entry, constrained to the expected kind (guards mismatched routes). */
export function entryBySlug(
  kind: CorpusKind,
  slug: string,
): CorpusEntry | undefined {
  const entry = CORPUS[slug];
  return entry && entry.kind === kind ? entry : undefined;
}

/** Body split into display paragraphs, each collapsed to a single line. */
export function paragraphs(entry: CorpusEntry): string[] {
  return entry.body
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * A one-line summary for cards and meta descriptions: prefer the first
 * outcome-style sentence, else the first paragraph of the body.
 */
export function summarize(entry: CorpusEntry): string {
  return paragraphs(entry)[0] ?? entry.title;
}
