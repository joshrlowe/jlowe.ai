// Placeholder profile content mirroring the v1 /about structure.
// Authoritative copy moves to corpus/ in a later phase.

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
