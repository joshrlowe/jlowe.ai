import type { Metadata } from "next";

import { ProjectsExplorer } from "@/components/projects-explorer";
import { PROJECTS } from "@/data/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "A collection of AI systems, web applications, and engineering solutions built for clients and personal exploration.",
};

export default function ProjectsPage() {
  return (
    <div className="py-14 pb-20">
      <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        A collection of AI systems, web applications, and engineering solutions
        I&apos;ve built for clients and personal exploration.
      </p>
      <div className="mt-8">
        <ProjectsExplorer projects={PROJECTS} />
      </div>
    </div>
  );
}
