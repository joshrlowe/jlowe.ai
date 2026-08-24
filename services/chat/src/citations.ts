import type { RetrievedChunk } from "@velocity/corpus-index";

export const CONTEXT_PREAMBLE =
  "Use the following sources to answer. Cite them inline using [1], [2], etc., matching the numbers below. If the sources don't contain relevant information, say so.";

export interface CitationItem {
  index: number;
  title: string;
  url: string;
  snippet: string;
}

/** Exported routes with `trailingSlash: true`. */
export function citationUrl(chunk: {
  sourceType: string;
  sourceSlug: string | null;
}): string | null {
  const slug = chunk.sourceSlug;
  if (!slug) return null;
  if (chunk.sourceType === "project") return `/projects/${slug}/`;
  if (chunk.sourceType === "article") return `/articles/${slug}/`;
  if (chunk.sourceType === "faq" && slug === "about") return "/about/";
  return null;
}

export function snippetOf(content: string, max = 200): string {
  const trimmed = content.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export function formatContext(chunks: readonly RetrievedChunk[]): string {
  const body = chunks
    .map((chunk, i) => {
      const heading = chunk.headingPath.length
        ? ` › ${chunk.headingPath.join(" › ")}`
        : "";
      return `[${i + 1}] ${chunk.sourceTitle}${heading}\n${chunk.content}`;
    })
    .join("\n\n");
  return body ? `${CONTEXT_PREAMBLE}\n\n${body}` : CONTEXT_PREAMBLE;
}

export function buildCitations(
  chunks: readonly RetrievedChunk[],
): CitationItem[] {
  const items: CitationItem[] = [];
  chunks.forEach((chunk, i) => {
    const url = citationUrl(chunk);
    if (!url) return;
    const lastHeading = chunk.headingPath[chunk.headingPath.length - 1];
    const title = lastHeading
      ? `${chunk.sourceTitle} — ${lastHeading}`
      : chunk.sourceTitle;
    items.push({
      index: i + 1,
      title,
      url,
      snippet: snippetOf(chunk.content),
    });
  });
  return items;
}
