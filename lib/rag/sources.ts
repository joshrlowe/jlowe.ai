/**
 * Knowledge source extractors. Turns Prisma models into clean markdown
 * the chunker can structure-aware split.
 *
 * Five source types match the user-facing routing:
 *   article  → /articles/${topic}/${slug}
 *   project  → /projects/${slug}
 *   about    → /about
 *   welcome  → /
 *   contact  → /contact
 *
 * Each `format*Source(row)` is a pure transform: a Prisma row in, a
 * KnowledgeSource out. Loaders compose those with the right Prisma queries.
 * Both the bulk script and the per-source background job share the formatters.
 */

import type { About, Contact, Post, Project, Welcome } from "@prisma/client";
import prisma from "@/lib/prisma";

export type KnowledgeSourceType = "article" | "project" | "about" | "welcome" | "contact";

export interface KnowledgeSource {
  sourceType: KnowledgeSourceType;
  sourceId: string;
  /** For articles: `${topic}/${slug}`. For projects: `slug`. Null for singletons. */
  sourceSlug: string | null;
  sourceTitle: string;
  /** Markdown ready for chunkMarkdown(). */
  markdown: string;
  url: string | null;
}

function trimAll(parts: (string | null | undefined)[]): string {
  return parts
    .filter((p): p is string => Boolean(p && p.trim()))
    .map((p) => p.trim())
    .join("\n\n");
}

function formatTechStack(stack: unknown): string {
  if (!stack) return "";
  if (Array.isArray(stack)) {
    const names = stack
      .map((t) => (typeof t === "string" ? t : ((t as { name?: string }).name ?? "")))
      .filter(Boolean);
    return names.length ? `## Tech Stack\n\n${names.map((n) => `- ${n}`).join("\n")}` : "";
  }
  if (typeof stack === "object") {
    const groups = Object.entries(stack as Record<string, unknown>)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          const flat = value
            .map((v) => (typeof v === "string" ? v : ((v as { name?: string }).name ?? "")))
            .filter(Boolean);
          return flat.length ? `### ${key}\n\n${flat.map((n) => `- ${n}`).join("\n")}` : "";
        }
        if (typeof value === "string" && value.trim()) {
          return `### ${key}\n\n${value}`;
        }
        return "";
      })
      .filter(Boolean);
    return groups.length ? `## Tech Stack\n\n${groups.join("\n\n")}` : "";
  }
  return "";
}

function formatTags(tags: unknown): string {
  if (!Array.isArray(tags) || tags.length === 0) return "";
  return `## Tags\n\n${tags.filter((t) => typeof t === "string").join(", ")}`;
}

interface ExperienceEntry {
  company?: string;
  role?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isOngoing?: boolean;
  achievements?: string[];
}

interface EducationEntry {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  isOngoing?: boolean;
}

interface CertEntry {
  name?: string;
  organization?: string;
  issueDate?: string;
}

interface SkillGroup {
  category?: string;
  skills?: Array<{ name?: string; expertiseLevel?: string }>;
}

interface LeadershipEntry {
  organization?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  achievements?: string[];
}

interface ContactSocial {
  linkedIn?: string;
  github?: string;
  X?: string;
  twitter?: string;
  [k: string]: unknown;
}

export function formatArticleSource(p: Post): KnowledgeSource {
  const md = trimAll([`# ${p.title}`, p.description ? `*${p.description}*` : null, p.content]);
  return {
    sourceType: "article",
    sourceId: p.id,
    sourceSlug: `${p.topic}/${p.slug}`,
    sourceTitle: p.title,
    markdown: md,
    url: `/articles/${p.topic}/${p.slug}`,
  };
}

export function formatProjectSource(p: Project): KnowledgeSource {
  const md = trimAll([
    `# ${p.title}`,
    p.shortDescription ? `*${p.shortDescription}*` : null,
    p.longDescription,
    !p.longDescription && p.description ? p.description : null,
    formatTechStack(p.techStack),
    formatTags(p.tags),
  ]);
  return {
    sourceType: "project",
    sourceId: p.id,
    sourceSlug: p.slug ?? null,
    sourceTitle: p.title,
    markdown: md,
    url: p.slug ? `/projects/${p.slug}` : null,
  };
}

export function formatAboutSource(about: About): KnowledgeSource {
  const sections: string[] = ["# About Josh"];

  if (about.professionalSummary) {
    sections.push(`## Professional Summary\n\n${about.professionalSummary}`);
  }

  const experience = (about.professionalExperience ?? []) as ExperienceEntry[];
  if (experience.length) {
    const blocks = experience.map((e) => {
      const dates = e.isOngoing
        ? `${e.startDate ?? ""} – Present`
        : `${e.startDate ?? ""} – ${e.endDate ?? ""}`;
      const lines = [`### ${e.role ?? "Role"} at ${e.company ?? "Company"}`, `*${dates.trim()}*`];
      if (e.description) lines.push(e.description);
      if (Array.isArray(e.achievements) && e.achievements.length) {
        lines.push(e.achievements.map((a) => `- ${a}`).join("\n"));
      }
      return lines.join("\n\n");
    });
    sections.push(`## Professional Experience\n\n${blocks.join("\n\n")}`);
  }

  const skills = (about.technicalSkills ?? []) as SkillGroup[];
  if (skills.length) {
    const blocks = skills.map((g) => {
      const items = (g.skills ?? [])
        .map((s) =>
          s.name ? `- ${s.name}${s.expertiseLevel ? ` (${s.expertiseLevel})` : ""}` : ""
        )
        .filter(Boolean)
        .join("\n");
      return `### ${g.category ?? "Skills"}\n\n${items}`;
    });
    sections.push(`## Technical Skills\n\n${blocks.join("\n\n")}`);
  }

  const education = (about.education ?? []) as EducationEntry[];
  if (education.length) {
    const blocks = education.map((e) => {
      const dates = e.isOngoing
        ? `${e.startDate ?? ""} – Present`
        : `${e.startDate ?? ""} – ${e.endDate ?? ""}`;
      return [
        `### ${e.institution ?? "Institution"}`,
        `*${dates.trim()}*`,
        [e.degree, e.fieldOfStudy].filter(Boolean).join(" — "),
      ]
        .filter(Boolean)
        .join("\n\n");
    });
    sections.push(`## Education\n\n${blocks.join("\n\n")}`);
  }

  const certs = (about.technicalCertifications ?? []) as CertEntry[];
  if (certs.length) {
    const items = certs
      .map((c) =>
        c.name
          ? `- ${c.name}${c.organization ? ` — ${c.organization}` : ""}${c.issueDate ? ` (${c.issueDate})` : ""}`
          : ""
      )
      .filter(Boolean)
      .join("\n");
    sections.push(`## Technical Certifications\n\n${items}`);
  }

  const leadership = (about.leadershipExperience ?? []) as LeadershipEntry[];
  if (leadership.length) {
    const blocks = leadership.map((l) => {
      const dates = `${l.startDate ?? ""} – ${l.endDate ?? "Present"}`;
      const lines = [
        `### ${l.role ?? "Role"} at ${l.organization ?? "Organization"}`,
        `*${dates.trim()}*`,
      ];
      if (Array.isArray(l.achievements) && l.achievements.length) {
        lines.push(l.achievements.map((a) => `- ${a}`).join("\n"));
      }
      return lines.join("\n\n");
    });
    sections.push(`## Leadership Experience\n\n${blocks.join("\n\n")}`);
  }

  const hobbies = (about.hobbies ?? []) as Array<string | { name?: string }>;
  if (hobbies.length) {
    const items = hobbies
      .map((h) => (typeof h === "string" ? h : (h.name ?? "")))
      .filter(Boolean)
      .map((h) => `- ${h}`)
      .join("\n");
    if (items) sections.push(`## Hobbies\n\n${items}`);
  }

  return {
    sourceType: "about",
    sourceId: about.id,
    sourceSlug: null,
    sourceTitle: "About Josh",
    markdown: sections.join("\n\n"),
    url: "/about",
  };
}

export function formatWelcomeSource(welcome: Welcome): KnowledgeSource {
  const md = trimAll([`# ${welcome.name}`, welcome.briefBio, welcome.callToAction ?? null]);
  return {
    sourceType: "welcome",
    sourceId: welcome.id,
    sourceSlug: null,
    sourceTitle: welcome.name,
    markdown: md,
    url: "/",
  };
}

export function formatContactSource(contact: Contact): KnowledgeSource {
  const lines: string[] = ["# Contact"];
  if (contact.emailAddress) lines.push(`- Email: ${contact.emailAddress}`);
  if (contact.phoneNumber) lines.push(`- Phone: ${contact.phoneNumber}`);
  const social = (contact.socialMediaLinks ?? null) as ContactSocial | null;
  if (social) {
    Object.entries(social).forEach(([k, v]) => {
      if (typeof v === "string" && v.trim()) {
        lines.push(`- ${k}: ${v}`);
      }
    });
  }

  return {
    sourceType: "contact",
    sourceId: contact.id,
    sourceSlug: null,
    sourceTitle: "Contact",
    markdown: lines.join("\n"),
    url: "/contact",
  };
}

async function articles(): Promise<KnowledgeSource[]> {
  const posts = await prisma.post.findMany({
    where: { status: "Published" },
    orderBy: { datePublished: "desc" },
  });
  return posts.map(formatArticleSource);
}

async function projects(): Promise<KnowledgeSource[]> {
  const rows = await prisma.project.findMany({
    where: { status: { not: "Draft" } },
    orderBy: { startDate: "desc" },
  });
  return rows.map(formatProjectSource);
}

async function aboutSource(): Promise<KnowledgeSource[]> {
  const about = await prisma.about.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  return about ? [formatAboutSource(about)] : [];
}

async function welcomeSource(): Promise<KnowledgeSource[]> {
  const welcome = await prisma.welcome.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  return welcome ? [formatWelcomeSource(welcome)] : [];
}

async function contactSource(): Promise<KnowledgeSource[]> {
  const contact = await prisma.contact.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  return contact ? [formatContactSource(contact)] : [];
}

export async function loadAllSources(): Promise<KnowledgeSource[]> {
  const [a, p, ab, w, c] = await Promise.all([
    articles(),
    projects(),
    aboutSource(),
    welcomeSource(),
    contactSource(),
  ]);
  return [...a, ...p, ...ab, ...w, ...c];
}
