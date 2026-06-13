// Placeholder article entries mirroring the v1 /articles list.
// Detail routes and real content arrive with the corpus in a later phase.

export interface ArticlePreview {
  slug: string;
  topic: string;
  title: string;
  description: string;
  publishedAt: string; // ISO date
  readingMinutes: number;
}

export const ARTICLES: readonly ArticlePreview[] = [
  {
    slug: "progressive-enhancement-for-3d-sites",
    topic: "web",
    title: "Progressive enhancement for 3D sites",
    description:
      "WebGPU where it shines, WebGL2 where it must, and a 2D shell that search engines and screen readers actually get.",
    publishedAt: "2026-05-01",
    readingMinutes: 7,
  },
  {
    slug: "rag-that-cites-its-sources",
    topic: "ai",
    title: "RAG that cites its sources",
    description:
      "Hybrid retrieval, reciprocal rank fusion, and why numbered citations change how users trust an AI answer.",
    publishedAt: "2026-03-10",
    readingMinutes: 9,
  },
  {
    slug: "fail-open-llm-moderation",
    topic: "ai",
    title: "Fail-open LLM moderation",
    description:
      "Designing a moderation pipeline where infrastructure failures hold content for review instead of rejecting it.",
    publishedAt: "2026-01-22",
    readingMinutes: 6,
  },
] as const;
