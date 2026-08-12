/**
 * Tests for lib/rag/sources.ts — Prisma rows → markdown knowledge sources.
 *
 * The format* functions are pure transforms; the loaders compose them with
 * Prisma queries (globally mocked via __mocks__/prisma.js — override with
 * jest.spyOn per test).
 */

import type { About, Contact, Post, Project, Welcome } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  formatArticleSource,
  formatProjectSource,
  formatAboutSource,
  formatWelcomeSource,
  formatContactSource,
  loadAllSources,
} from "@/lib/rag/sources";

const basePost = {
  id: "post-1",
  title: "Hybrid Search",
  description: "Vector + keyword",
  content: "Body text.",
  topic: "ai",
  slug: "hybrid-search",
} as unknown as Post;

const baseProject = {
  id: "proj-1",
  title: "Jarvis",
  slug: "jarvis",
  description: "Legacy short",
  shortDescription: "Self-hosted assistant",
  longDescription: "Long body.",
  techStack: null,
  tags: null,
} as unknown as Project;

describe("formatArticleSource", () => {
  it("builds markdown with title, italic description, and content", () => {
    const src = formatArticleSource(basePost);
    expect(src).toMatchObject({
      sourceType: "article",
      sourceId: "post-1",
      sourceSlug: "ai/hybrid-search",
      sourceTitle: "Hybrid Search",
      url: "/articles/ai/hybrid-search",
    });
    expect(src.markdown).toBe("# Hybrid Search\n\n*Vector + keyword*\n\nBody text.");
  });

  it("omits the description block when empty", () => {
    const src = formatArticleSource({ ...basePost, description: "" } as Post);
    expect(src.markdown).toBe("# Hybrid Search\n\nBody text.");
  });
});

describe("formatProjectSource", () => {
  it("prefers longDescription and skips the legacy description", () => {
    const src = formatProjectSource(baseProject);
    expect(src.markdown).toContain("Long body.");
    expect(src.markdown).not.toContain("Legacy short");
    expect(src.url).toBe("/projects/jarvis");
    expect(src.sourceSlug).toBe("jarvis");
  });

  it("falls back to legacy description when longDescription is missing", () => {
    const src = formatProjectSource({
      ...baseProject,
      longDescription: null,
    } as unknown as Project);
    expect(src.markdown).toContain("Legacy short");
    expect(src.markdown).toContain("Legacy short");
  });

  it("handles a null slug with a null url and slug", () => {
    const src = formatProjectSource({ ...baseProject, slug: null } as unknown as Project);
    expect(src.sourceSlug).toBeNull();
    expect(src.url).toBeNull();
  });

  it("formats an array techStack of strings and objects", () => {
    const src = formatProjectSource({
      ...baseProject,
      techStack: ["TypeScript", { name: "Next.js" }, { notName: true }, 42],
    } as unknown as Project);
    expect(src.markdown).toContain("## Tech Stack");
    expect(src.markdown).toContain("- TypeScript");
    expect(src.markdown).toContain("- Next.js");
  });

  it("returns no tech stack section for an empty array", () => {
    const src = formatProjectSource({ ...baseProject, techStack: [] } as unknown as Project);
    expect(src.markdown).not.toContain("## Tech Stack");
  });

  it("formats a grouped object techStack with arrays and strings", () => {
    const src = formatProjectSource({
      ...baseProject,
      techStack: {
        Frontend: ["React", { name: "Tailwind" }],
        Backend: "Node.js",
        Empty: [],
        Blank: "   ",
        Odd: 42,
      },
    } as unknown as Project);
    expect(src.markdown).toContain("### Frontend");
    expect(src.markdown).toContain("- React");
    expect(src.markdown).toContain("- Tailwind");
    expect(src.markdown).toContain("### Backend\n\nNode.js");
    expect(src.markdown).not.toContain("### Empty");
    expect(src.markdown).not.toContain("### Blank");
    expect(src.markdown).not.toContain("### Odd");
  });

  it("returns no tech stack section when every group is empty", () => {
    const src = formatProjectSource({
      ...baseProject,
      techStack: { Empty: [], Blank: "" },
    } as unknown as Project);
    expect(src.markdown).not.toContain("## Tech Stack");
  });

  it("ignores a scalar techStack", () => {
    const src = formatProjectSource({
      ...baseProject,
      techStack: "just-a-string" as unknown,
    } as unknown as Project);
    expect(src.markdown).not.toContain("## Tech Stack");
  });

  it("formats string tags and ignores non-arrays and non-strings", () => {
    const withTags = formatProjectSource({
      ...baseProject,
      tags: ["rag", "search", 7],
    } as unknown as Project);
    expect(withTags.markdown).toContain("## Tags\n\nrag, search");

    const noTags = formatProjectSource({
      ...baseProject,
      tags: { not: "an array" },
    } as unknown as Project);
    expect(noTags.markdown).not.toContain("## Tags");
  });
});

describe("formatAboutSource", () => {
  const emptyAbout = {
    id: "about-1",
    professionalSummary: null,
    professionalExperience: null,
    technicalSkills: null,
    education: null,
    technicalCertifications: null,
    leadershipExperience: null,
    hobbies: null,
  } as unknown as About;

  it("renders only the heading when everything is empty", () => {
    const src = formatAboutSource(emptyAbout);
    expect(src.markdown).toBe("# About Josh");
    expect(src).toMatchObject({
      sourceType: "about",
      sourceSlug: null,
      sourceTitle: "About Josh",
      url: "/about",
    });
  });

  it("renders every section when populated", () => {
    const src = formatAboutSource({
      ...emptyAbout,
      professionalSummary: "AI engineer.",
      professionalExperience: [
        {
          company: "BidOps",
          role: "Tech Lead",
          startDate: "2024",
          isOngoing: true,
          description: "Leads AI.",
          achievements: ["Shipped RAG", "Cut costs"],
        },
        { startDate: "2020", endDate: "2024" },
      ],
      technicalSkills: [
        {
          category: "Languages",
          skills: [{ name: "TypeScript", expertiseLevel: "Expert" }, { name: "Python" }, {}],
        },
        {},
      ],
      education: [
        { institution: "UCF", degree: "M.S.", fieldOfStudy: "CS", startDate: "2023", isOngoing: true },
        { startDate: "2019", endDate: "2023", degree: "B.S." },
      ],
      technicalCertifications: [
        { name: "AWS SAA", organization: "AWS", issueDate: "2024" },
        { name: "Bare Cert" },
        { organization: "No Name Org" },
      ],
      leadershipExperience: [
        {
          organization: "ACM",
          role: "President",
          startDate: "2022",
          achievements: ["Grew club"],
        },
        { endDate: "2021" },
      ],
      hobbies: ["F1", { name: "Chess" }, {}, ""],
    } as unknown as About);

    expect(src.markdown).toContain("## Professional Summary\n\nAI engineer.");
    expect(src.markdown).toContain("### Tech Lead at BidOps");
    expect(src.markdown).toContain("*2024 – Present*");
    expect(src.markdown).toContain("- Shipped RAG");
    expect(src.markdown).toContain("### Role at Company");
    expect(src.markdown).toContain("*2020 – 2024*");
    expect(src.markdown).toContain("### Languages");
    expect(src.markdown).toContain("- TypeScript (Expert)");
    expect(src.markdown).toContain("- Python");
    expect(src.markdown).toContain("### Skills");
    expect(src.markdown).toContain("### UCF");
    expect(src.markdown).toContain("*2023 – Present*");
    expect(src.markdown).toContain("M.S. — CS");
    expect(src.markdown).toContain("- AWS SAA — AWS (2024)");
    expect(src.markdown).toContain("- Bare Cert");
    expect(src.markdown).not.toContain("No Name Org");
    expect(src.markdown).toContain("### President at ACM");
    expect(src.markdown).toContain("*2022 – Present*");
    expect(src.markdown).toContain("### Role at Organization");
    expect(src.markdown).toContain("- F1");
    expect(src.markdown).toContain("- Chess");
  });

  it("drops the hobbies section when entries are all empty", () => {
    const src = formatAboutSource({
      ...emptyAbout,
      hobbies: [{}, ""],
    } as unknown as About);
    expect(src.markdown).not.toContain("## Hobbies");
  });
});

describe("formatWelcomeSource", () => {
  it("builds markdown from name, bio, and call to action", () => {
    const src = formatWelcomeSource({
      id: "w1",
      name: "Josh Lowe",
      briefBio: "Builder.",
      callToAction: "Say hi",
    } as unknown as Welcome);
    expect(src.markdown).toBe("# Josh Lowe\n\nBuilder.\n\nSay hi");
    expect(src).toMatchObject({ sourceType: "welcome", url: "/", sourceTitle: "Josh Lowe" });
  });

  it("tolerates a missing call to action", () => {
    const src = formatWelcomeSource({
      id: "w1",
      name: "Josh",
      briefBio: "Bio",
      callToAction: null,
    } as unknown as Welcome);
    expect(src.markdown).toBe("# Josh\n\nBio");
  });
});

describe("formatContactSource", () => {
  it("lists email, phone, and string social links only", () => {
    const src = formatContactSource({
      id: "c1",
      emailAddress: "j@x.com",
      phoneNumber: "555",
      socialMediaLinks: { github: "gh.io/j", linkedIn: "  ", nested: { no: true }, X: "x.com/j" },
    } as unknown as Contact);
    expect(src.markdown).toContain("- Email: j@x.com");
    expect(src.markdown).toContain("- Phone: 555");
    expect(src.markdown).toContain("- github: gh.io/j");
    expect(src.markdown).toContain("- X: x.com/j");
    expect(src.markdown).not.toContain("linkedIn");
    expect(src.markdown).not.toContain("nested");
  });

  it("renders just the heading with no data", () => {
    const src = formatContactSource({
      id: "c1",
      emailAddress: null,
      phoneNumber: null,
      socialMediaLinks: null,
    } as unknown as Contact);
    expect(src.markdown).toBe("# Contact");
    expect(src.url).toBe("/contact");
  });
});

describe("loadAllSources", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("aggregates all five source types in order", async () => {
    jest.spyOn(prisma.post, "findMany").mockResolvedValue([basePost] as never);
    jest.spyOn(prisma.project, "findMany").mockResolvedValue([baseProject] as never);
    jest
      .spyOn(prisma.about, "findFirst")
      .mockResolvedValue({ id: "a1" } as never);
    jest
      .spyOn(prisma.welcome, "findFirst")
      .mockResolvedValue({ id: "w1", name: "Josh", briefBio: "Bio" } as never);
    jest
      .spyOn(prisma.contact, "findFirst")
      .mockResolvedValue({ id: "c1", emailAddress: "j@x.com" } as never);

    const sources = await loadAllSources();

    expect(sources.map((s) => s.sourceType)).toEqual([
      "article",
      "project",
      "about",
      "welcome",
      "contact",
    ]);
    expect(prisma.post.findMany).toHaveBeenCalledWith({
      where: { status: "Published" },
      orderBy: { datePublished: "desc" },
    });
    expect(prisma.project.findMany).toHaveBeenCalledWith({
      where: { status: { not: "Draft" } },
      orderBy: { startDate: "desc" },
    });
  });

  it("omits singleton sources whose rows are absent", async () => {
    jest.spyOn(prisma.post, "findMany").mockResolvedValue([] as never);
    jest.spyOn(prisma.project, "findMany").mockResolvedValue([] as never);
    jest.spyOn(prisma.about, "findFirst").mockResolvedValue(null as never);
    jest.spyOn(prisma.welcome, "findFirst").mockResolvedValue(null as never);
    jest.spyOn(prisma.contact, "findFirst").mockResolvedValue(null as never);

    await expect(loadAllSources()).resolves.toEqual([]);
  });
});
