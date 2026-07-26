// Placeholder profile content mirroring the v1 /about structure.
//
// The About page still reads THIS file (not the corpus) because the corpus
// frontmatter schema has no fields for structured experience, skill groups, or
// education — those would need a schema change before they could move to
// corpus/. Kept here deliberately until then.
//
// TODO(josh): confirm every real-world specific below before this is treated as
//   authoritative — the employer/degree are corroborated by corpus/faq/about.md,
//   but these are NOT verifiable from the repo and may be placeholders:
//   - EXPERIENCE[].period: the employment date ranges ("2024 — present", etc.)
//   - EDUCATION[].period: currently "—" (no dates)
//   - EXPERIENCE[].summary: wording of each role's summary.

export interface SkillCategory {
  category: string;
  skills: readonly string[];
}

export interface ExperienceEntry {
  role: string;
  organization: string;
  period: string;
  summary: string;
}

export interface EducationEntry {
  school: string;
  degree: string;
  period: string;
}

export const PROFESSIONAL_SUMMARY =
  "AI engineer and consultant focused on shipping production-grade AI systems: " +
  "retrieval-augmented generation, LLM-powered products, and the data platforms " +
  "underneath them. I care about systems that hold up in production — observable, " +
  "tested, and honest about their failure modes.";

export const SKILL_CATEGORIES: readonly SkillCategory[] = [
  {
    category: "AI / ML",
    skills: [
      "LLM applications",
      "RAG pipelines",
      "AWS Bedrock",
      "PyTorch",
      "Evaluation & observability",
    ],
  },
  {
    category: "Engineering",
    skills: [
      "TypeScript",
      "Python",
      "React / Next.js",
      "Node.js",
      "PostgreSQL",
    ],
  },
  {
    category: "Cloud & Infra",
    skills: ["AWS", "Terraform", "Serverless", "CI/CD", "Postgres + pgvector"],
  },
] as const;

export const EXPERIENCE: readonly ExperienceEntry[] = [
  {
    role: "Tech Lead",
    organization: "BidOps AI",
    period: "2024 — present",
    summary:
      "Leading engineering on AI-assisted bidding workflows: LLM pipelines, retrieval, and the platform around them.",
  },
  {
    role: "AI Engineer & Consultant",
    organization: "Independent (jlowe.ai)",
    period: "2023 — present",
    summary:
      "Designing and shipping AI features for client products, from prototype to production.",
  },
] as const;

export const EDUCATION: readonly EducationEntry[] = [
  {
    school: "University of Central Florida",
    degree: "M.S. Computer Science",
    period: "—",
  },
] as const;
