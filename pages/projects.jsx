/**
 * Projects Page
 *
 * Portfolio showcase with:
 * - Space-themed design
 * - Filtering and search
 * - Infinite scroll
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import prisma from "../lib/prisma.js";
import { transformProjectsToApiFormat } from "../lib/utils/projectTransformer.js";
import {
  DEBOUNCE_DELAY_MS,
  INITIAL_PROJECT_DISPLAY_COUNT,
  PROJECTS_PER_PAGE,
} from "@/lib/utils/constants";
import SEO from "@/components/SEO";
import ProjectCard from "@/components/Project/ProjectCard";
import ProjectFilters from "@/components/Project/ProjectFilters";
import ProjectsEmptyState from "@/components/Project/ProjectsEmptyState";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ProjectsPage({ projects: initialProjects }) {
  const router = useRouter();
  const headerRef = useRef(null);
  const [projects] = useState(initialProjects || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortBy, setSortBy] = useState("startDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [displayCount, setDisplayCount] = useState(
    INITIAL_PROJECT_DISPLAY_COUNT,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);

  // Header animation
  useEffect(() => {
    if (!headerRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
    );
  }, []);

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, DEBOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { availableTags, availableStatuses } = useMemo(() => {
    const tags = new Set();
    const statuses = new Set();

    projects.forEach((project) => {
      let projectTags = [];
      if (Array.isArray(project.tags)) {
        projectTags = project.tags;
      } else if (typeof project.tags === "string") {
        try {
          projectTags = JSON.parse(project.tags || "[]");
        } catch {
          projectTags = [];
        }
      }
      if (Array.isArray(projectTags)) {
        projectTags.forEach((tag) => {
          if (tag) tags.add(String(tag));
        });
      }

      if (project.status) {
        statuses.add(project.status);
      }
    });

    return {
      availableTags: Array.from(tags).sort(),
      availableStatuses: Array.from(statuses).sort(),
    };
  }, [projects]);

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter((p) => {
        // Search in title
        if (p.title?.toLowerCase().includes(query)) return true;
        // Search in short description
        if (p.shortDescription?.toLowerCase().includes(query)) return true;
        // Search in long description
        if (p.description?.toLowerCase().includes(query)) return true;
        if (p.longDescription?.toLowerCase().includes(query)) return true;
        // Search in tags
        if (
          Array.isArray(p.tags) &&
          p.tags.some((tag) => tag.toLowerCase().includes(query))
        )
          return true;
        // Search in tech stack (skills)
        let techStack = [];
        if (Array.isArray(p.techStack)) {
          techStack = p.techStack;
        } else if (typeof p.techStack === "string") {
          try {
            techStack = JSON.parse(p.techStack || "[]");
          } catch {
            techStack = [];
          }
        }
        if (
          Array.isArray(techStack) &&
          techStack.some((tech) => {
            const techName =
              typeof tech === "string" ? tech : tech.name || "";
            return techName.toLowerCase().includes(query);
          })
        )
          return true;
        return false;
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (tagFilter !== "all") {
      filtered = filtered.filter((p) => {
        let tags = [];
        if (Array.isArray(p.tags)) {
          tags = p.tags;
        } else if (typeof p.tags === "string") {
          try {
            tags = JSON.parse(p.tags || "[]");
          } catch {
            tags = [];
          }
        }
        return Array.isArray(tags) && tags.includes(tagFilter);
      });
    }

    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "startDate" || sortBy === "releaseDate") {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal || "").toLowerCase();
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [projects, debouncedSearch, statusFilter, tagFilter, sortBy, sortOrder]);

  const displayedProjects = useMemo(() => {
    return filteredAndSortedProjects.slice(0, displayCount);
  }, [filteredAndSortedProjects, displayCount]);

  const hasMore = filteredAndSortedProjects.length > displayCount;

  useEffect(() => {
    setDisplayCount(INITIAL_PROJECT_DISPLAY_COUNT);
  }, [debouncedSearch, statusFilter, tagFilter, sortBy, sortOrder]);

  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setDisplayCount((prev) =>
              Math.min(
                prev + PROJECTS_PER_PAGE,
                filteredAndSortedProjects.length,
              ),
            );
            setIsLoadingMore(false);
          }, DEBOUNCE_DELAY_MS);
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, [hasMore, isLoadingMore, filteredAndSortedProjects.length]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTagFilter("all");
    router.push("/projects", undefined, { shallow: true });
  };

  const hasActiveFilters =
    searchQuery || statusFilter !== "all" || tagFilter !== "all";

  return (
    <>
      <SEO
        title="Projects - Josh Lowe"
        description="Explore my portfolio of AI, machine learning, and full-stack development projects."
      />

      <div className="section relative z-10">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div ref={headerRef} className="mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 font-[family-name:var(--font-oswald)]">
              <span className="gradient-text">Projects</span>
            </h1>
            <p
              className="text-lg text-[var(--color-text-secondary)]"
              style={{ maxWidth: "80%" }}
            >
              A collection of AI systems, web applications, and engineering
              solutions I've built for clients and personal exploration.
            </p>
          </div>

          {/* Filters */}
          <ProjectFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            tagFilter={tagFilter}
            onTagFilterChange={setTagFilter}
            availableTags={availableTags}
            availableStatuses={availableStatuses}
            onClearFilters={handleClearFilters}
          />

          {/* Sort Options */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="text-sm text-[var(--color-text-muted)]">
              <span className="text-[var(--color-text-primary)] font-medium">
                {filteredAndSortedProjects.length}
              </span>{" "}
              project{filteredAndSortedProjects.length !== 1 ? "s" : ""} found
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-[var(--color-text-muted)] whitespace-nowrap">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
                  aria-label="Sort by"
                >
                  <option value="startDate">Start Date</option>
                  <option value="releaseDate">Release Date</option>
                  <option value="title">Title</option>
                  <option value="status">Status</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-[var(--color-text-muted)] whitespace-nowrap">
                  Order:
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
                  aria-label="Sort order"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          {filteredAndSortedProjects.length === 0 ? (
            <ProjectsEmptyState
              hasFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                  />
                ))}
              </div>

              {/* Load More Trigger */}
              {hasMore && (
                <div
                  ref={loadMoreRef}
                  className="h-24 flex justify-center items-center mt-8"
                >
                  {isLoadingMore && (
                    <div className="flex items-center gap-3 text-[var(--color-text-muted)]">
                      <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                      <span>Loading more...</span>
                    </div>
                  )}
                </div>
              )}

              {/* End of results */}
              {!hasMore && displayedProjects.length > 0 && (
                <div className="text-center mt-12 py-8 border-t border-[var(--color-border)]">
                  <p className="text-[var(--color-text-muted)] text-sm">
                    You've seen all {filteredAndSortedProjects.length} project
                    {filteredAndSortedProjects.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export async function getStaticProps() {
  try {
    const projectsRaw = await prisma.project.findMany({
      where: {
        status: {
          not: "Draft",
        },
      },
      orderBy: {
        startDate: "desc",
      },
      include: {
        teamMembers: true,
      },
    });

    const projects = transformProjectsToApiFormat(projectsRaw);

    return {
      props: {
        projects: JSON.parse(JSON.stringify(projects)),
      },
      revalidate: 60,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error in getStaticProps:", error);
    }
    return {
      props: {
        projects: [],
      },
      revalidate: 60,
    };
  }
}
