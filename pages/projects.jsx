import { useState, useEffect, useMemo, useRef } from "react";
import { Container, Row, Col, Form } from "react-bootstrap";
import { useRouter } from "next/router";
import prisma from "../lib/prisma.js";
import { transformProjectsToApiFormat } from "../lib/utils/projectTransformer.js";
import SEO from "@/components/SEO";
import ProjectCard from "@/components/Project/ProjectCard";
import ProjectFilters from "@/components/Project/ProjectFilters";
import ProjectsEmptyState from "@/components/Project/ProjectsEmptyState";
import ProjectSkeleton from "@/components/Project/ProjectSkeleton";

export default function ProjectsPage({ projects: initialProjects }) {
  const router = useRouter();
  const [projects] = useState(initialProjects || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortBy, setSortBy] = useState("startDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [displayCount, setDisplayCount] = useState(9); // Initial display count
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const cardsRef = useRef([]);
  const loadMoreRef = useRef(null);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Extract unique tags and statuses
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

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // Search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(query) ||
          p.shortDescription?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          (Array.isArray(p.tags) && p.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Tag filter
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

    // Sort
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

  // Get displayed projects based on displayCount
  const displayedProjects = useMemo(() => {
    return filteredAndSortedProjects.slice(0, displayCount);
  }, [filteredAndSortedProjects, displayCount]);

  // Check if there are more projects to load
  const hasMore = filteredAndSortedProjects.length > displayCount;

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(9);
  }, [debouncedSearch, statusFilter, tagFilter, sortBy, sortOrder]);

  // Infinite scroll: Load more projects when scrolling near bottom
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          // Simulate a small delay for smooth loading
          setTimeout(() => {
            setDisplayCount((prev) => Math.min(prev + 9, filteredAndSortedProjects.length));
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, isLoadingMore, filteredAndSortedProjects.length]);

  // Cards are now visible by default - removed IntersectionObserver animation
  // Cards will still animate on hover via CSS

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTagFilter("all");
    router.push("/projects", undefined, { shallow: true });
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || tagFilter !== "all";

  return (
    <>
      <SEO
        title="Projects - Josh Lowe"
        description="View my portfolio of software development projects, featuring web applications, APIs, and full-stack solutions."
      />
      <Container className="my-5">
        <h1 className="mb-4" style={{ 
          fontFamily: "var(--font-family-display)",
          fontSize: "var(--font-size-5xl)",
          fontWeight: "var(--font-weight-semibold)",
          color: "var(--color-primary)"
        }}>
          Projects
        </h1>

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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
            Showing {displayedProjects.length} of {filteredAndSortedProjects.length} project{filteredAndSortedProjects.length !== 1 ? "s" : ""}
          </div>
          <div className="d-flex gap-2 align-items-center">
            <Form.Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              size="sm"
              style={{
                backgroundColor: "var(--color-bg-dark)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
                width: "auto",
                minWidth: "150px",
              }}
              aria-label="Sort by"
            >
              <option value="startDate">Start Date</option>
              <option value="releaseDate">Release Date</option>
              <option value="title">Title</option>
              <option value="status">Status</option>
            </Form.Select>
            <Form.Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              size="sm"
              style={{
                backgroundColor: "var(--color-bg-dark)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
                width: "auto",
                minWidth: "120px",
              }}
              aria-label="Sort order"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </Form.Select>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredAndSortedProjects.length === 0 ? (
          <ProjectsEmptyState hasFilters={hasActiveFilters} onClearFilters={handleClearFilters} />
        ) : (
          <>
            <Row className="g-4">
              {displayedProjects.map((project, index) => (
                <Col key={project.id} md={6} lg={4}>
                  <div
                    ref={(el) => {
                      if (el) {
                        cardsRef.current[index] = el;
                      }
                    }}
                    style={{
                      opacity: 1, // Changed from 0 to 1 - IntersectionObserver will still animate new cards
                      transform: "translateY(0)", // Changed from translateY(20px) to translateY(0)
                    }}
                  >
                    <ProjectCard project={project} index={index} />
                  </div>
                </Col>
              ))}
            </Row>

            {/* Load More Trigger */}
            {hasMore && (
              <div 
                ref={loadMoreRef} 
                style={{ 
                  height: "100px", 
                  display: "flex", 
                  justifyContent: "center", 
                  alignItems: "center",
                  marginTop: "var(--spacing-2xl)"
                }}
              >
                {isLoadingMore && (
                  <div style={{ color: "var(--color-text-secondary)" }}>
                    Loading more projects...
                  </div>
                )}
              </div>
            )}

            {/* End of results message */}
            {!hasMore && displayedProjects.length > 0 && (
              <div 
                style={{ 
                  textAlign: "center", 
                  color: "var(--color-text-secondary)", 
                  marginTop: "var(--spacing-2xl)",
                  fontSize: "var(--font-size-sm)"
                }}
              >
                You've reached the end. All {filteredAndSortedProjects.length} project{filteredAndSortedProjects.length !== 1 ? "s" : ""} displayed.
              </div>
            )}
          </>
        )}
      </Container>
    </>
  );
}

export async function getStaticProps() {
  try {
    // Get all projects except Draft status
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
    // Log error only in development
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
