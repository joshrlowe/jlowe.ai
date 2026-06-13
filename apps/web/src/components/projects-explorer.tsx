"use client";

import { useMemo, useState } from "react";

import { ProjectCard } from "@/components/project-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ALL_TAGS, type Project } from "@/data/projects";
import { cn } from "@/lib/utils";

export function ProjectsExplorer({
  projects,
}: {
  projects: readonly Project[];
}) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesQuery =
        q === "" ||
        project.title.toLowerCase().includes(q) ||
        project.summary.toLowerCase().includes(q) ||
        project.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchesTag = activeTag === null || project.tags.includes(activeTag);
      return matchesQuery && matchesTag;
    });
  }, [projects, query, activeTag]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search projects by title, description, or tech"
          aria-label="Search projects"
          className="sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              aria-pressed={activeTag === tag}
            >
              <Badge
                variant={activeTag === tag ? "default" : "outline"}
                className={cn(
                  "cursor-pointer",
                  activeTag !== tag && "hover:border-primary/60",
                )}
              >
                {tag}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground" role="status">
        {visible.length} project{visible.length === 1 ? "" : "s"} found
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Nothing matches that filter yet — try clearing the search.
        </p>
      ) : null}
    </div>
  );
}
