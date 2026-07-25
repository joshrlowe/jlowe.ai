import type { Metadata } from "next";

import { ProjectsExplorer } from "@/components/projects-explorer";
import { PROJECTS, type Project } from "@/data/projects";
import { entriesByKind, summarize } from "@/lib/corpus";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "A collection of AI systems, web applications, and engineering solutions built for clients and personal exploration.",
};

// Corpus is the single source of truth. Map its `kind: project` entries into the
// explorer's card shape and link each to its detail route. Fall back to the
// placeholder list only if the corpus has no projects for some reason.
const corpusProjects: Project[] = entriesByKind("project").map((entry) => ({
  slug: entry.slug,
  title: entry.title,
  summary: summarize(entry),
  tags: entry.stack ?? [],
  featured: false,
  href: `/projects/${entry.slug}/`,
}));

const projects: readonly Project[] =
  corpusProjects.length > 0 ? corpusProjects : PROJECTS;

export default function ProjectsPage() {
  return (
    <div className="py-14 pb-20">
      <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        A collection of AI systems, web applications, and engineering solutions
        I&apos;ve built for clients and personal exploration.
      </p>
      <div className="mt-8">
        <ProjectsExplorer projects={projects} />
      </div>
    </div>
  );
}
