// Placeholder project entries mirroring the v1 /projects grid.
// Listing only in Phase 0 — no detail routes yet.

export interface Project {
  slug: string;
  title: string;
  summary: string;
  tags: readonly string[];
  featured: boolean;
  links?: {
    github?: string;
    live?: string;
  };
}

export const PROJECTS: readonly Project[] = [
  {
    slug: "velocity",
    title: "Velocity (jlowe.ai 2.0)",
    summary:
      "This site: a game-quality 3D explorable journey with a Bedrock-powered digital twin, built on progressive enhancement.",
    tags: ["Three.js", "Next.js", "AWS", "In progress"],
    featured: true,
  },
  {
    slug: "ai-chat-funnel",
    title: "AI Chat Funnel",
    summary:
      "RAG-backed consultancy chat with intent classification, citation grounding, and lead qualification on AWS Bedrock.",
    tags: ["LLM", "RAG", "Bedrock", "Postgres"],
    featured: true,
  },
  {
    slug: "hacked-news",
    title: "Hacked News",
    summary:
      "A Hacker News client with ranked feeds and offline reading, built to explore data-heavy UI performance.",
    tags: ["React", "TypeScript"],
    featured: true,
    links: { github: "https://github.com/joshrlowe" },
  },
  {
    slug: "c-shell",
    title: "C Shell",
    summary:
      "A Unix shell implemented in C: job control, pipelines, redirection, and a hand-rolled parser.",
    tags: ["C", "Systems"],
    featured: false,
    links: { github: "https://github.com/joshrlowe" },
  },
  {
    slug: "embedding-pipeline",
    title: "Embedding Pipeline",
    summary:
      "Structure-aware chunking and content-hash-gated embedding regeneration, fanned out over background jobs.",
    tags: ["Python", "Embeddings", "Inngest"],
    featured: false,
  },
  {
    slug: "moderation-policy-engine",
    title: "Moderation Policy Engine",
    summary:
      "LLM-scored comment moderation with a deterministic policy layer and fail-open infrastructure semantics.",
    tags: ["LLM", "Trust & Safety"],
    featured: false,
  },
] as const;

export const ALL_TAGS: readonly string[] = [
  ...new Set(PROJECTS.flatMap((p) => p.tags)),
] as const;
