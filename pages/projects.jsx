/**
 * Projects Page
 *
 * Editorial Cool redesign — section header + asymmetric featured grid
 * + archive list with tag-chip filter.
 *
 * Data layer preserved: getStaticProps still pulls transformed Project
 * rows via Prisma + projectTransformer.
 */

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import prisma from "../lib/prisma.js";
import { transformProjectsToApiFormat } from "../lib/utils/projectTransformer.js";
import { parseJsonField } from "@/lib/utils/jsonUtils";
import { getPrefersReducedMotion } from "@/lib/hooks";
import SEO from "@/components/SEO";

const FEATURED_SPANS = [
  { col: "span 7", row: "span 2", big: true },
  { col: "span 5", row: "span 1", big: false },
  { col: "span 5", row: "span 1", big: false },
  { col: "span 12", row: "span 1", big: false },
];

function normalizeTech(techStack) {
  const parsed = parseJsonField(techStack, []);
  if (Array.isArray(parsed)) {
    return parsed
      .map((t) => (typeof t === "string" ? t : t?.name || null))
      .filter(Boolean);
  }
  if (parsed && typeof parsed === "object") {
    return Object.values(parsed)
      .flat()
      .map((t) => (typeof t === "string" ? t : t?.name || null))
      .filter(Boolean);
  }
  return [];
}

function primaryTag(tags) {
  const parsed = parseJsonField(tags, []);
  if (Array.isArray(parsed) && parsed.length > 0) return String(parsed[0]);
  if (typeof parsed === "string") return parsed;
  return "project";
}

function formatStatus(status) {
  if (!status) return "Draft";
  return String(status).replace(/([a-z])([A-Z])/g, "$1 $2");
}

export default function ProjectsPage({ projects: initialProjects }) {
  const router = useRouter();
  const sectionRef = useRef(null);
  const projects = useMemo(() => initialProjects || [], [initialProjects]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (!sectionRef.current) return;
    const reduce = getPrefersReducedMotion();
    const reveals = sectionRef.current.querySelectorAll(".reveal");
    reveals.forEach((el, i) => {
      if (reduce) {
        el.classList.add("in");
      } else {
        setTimeout(() => el.classList.add("in"), 80 + i * 100);
      }
    });
  }, [projects]);

  const allTags = useMemo(() => {
    const tags = new Set();
    projects.forEach((p) => {
      const tag = primaryTag(p.tags);
      if (tag && tag !== "project") tags.add(tag);
    });
    return ["All", ...Array.from(tags).sort()];
  }, [projects]);

  const filtered = useMemo(() => {
    if (filter === "All") return projects;
    return projects.filter((p) => primaryTag(p.tags) === filter);
  }, [projects, filter]);

  const featured = useMemo(
    () => projects.filter((p) => p.featured).slice(0, 4),
    [projects],
  );

  const goToProject = (project) => {
    router.push(`/projects/${project.slug || project.id}`);
  };

  return (
    <>
      <SEO
        title="Projects - Josh Lowe"
        description="AI systems, web applications, and engineering experiments — built for clients, research, and the thrill of learning."
        path="/projects"
      />

      <section
        ref={sectionRef}
        id="projects"
        className="section"
        style={{ padding: "160px 0" }}
      >
        <div className="container">
          {/* Section header */}
          <div className="reveal">
            <div className="eyebrow" style={{ marginBottom: 28 }}>
              <span className="num">02</span>
              <span className="bar" />
              <span>Projects</span>
            </div>
            <h1
              className="display"
              style={{
                fontSize: "clamp(48px, 6.2vw, 104px)",
                margin: 0,
                marginBottom: 22,
                lineHeight: 0.98,
              }}
            >
              Selected <em className="italic">work</em>.
            </h1>
            <p
              style={{
                fontSize: "clamp(17px, 1.4vw, 20px)",
                lineHeight: 1.55,
                color: "var(--ink-70)",
                margin: 0,
                maxWidth: 680,
                textWrap: "pretty",
              }}
            >
              AI systems, web applications, and engineering experiments — built
              for clients, research, and the thrill of learning.
            </p>
          </div>

          {/* Featured grid */}
          {featured.length > 0 && (
            <div
              className="reveal"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(12, 1fr)",
                gap: 20,
                marginTop: 88,
              }}
              data-feat
            >
              {featured.map((p, i) => {
                const span = FEATURED_SPANS[i] || FEATURED_SPANS[3];
                const tech = normalizeTech(p.techStack);
                const tag = primaryTag(p.tags);
                const status = formatStatus(p.status);
                const short = p.shortDescription || p.description || "";

                return (
                  <a
                    key={p.id}
                    href={`/projects/${p.slug || p.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      goToProject(p);
                    }}
                    className="card card-hover"
                    style={{
                      gridColumn: span.col,
                      gridRow: span.row,
                      padding: span.big ? 40 : 28,
                      position: "relative",
                      minHeight: span.big ? 460 : 230,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      overflow: "hidden",
                      textDecoration: "none",
                    }}
                  >
                    {span.big && (
                      <div
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "radial-gradient(circle at 78% 24%, rgba(34, 211, 238, 0.16), transparent 55%), radial-gradient(circle at 16% 84%, rgba(59, 130, 246, 0.18), transparent 50%)",
                          opacity: 0.95,
                          pointerEvents: "none",
                        }}
                      />
                    )}

                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        gap: 12,
                      }}
                    >
                      <div className="label-mono">{tag}</div>
                      <span
                        className={
                          "chip " + (status === "Completed" ? "on" : "")
                        }
                        style={{ fontSize: 10 }}
                      >
                        {status}
                      </span>
                    </div>

                    <div style={{ position: "relative" }}>
                      <h3
                        className="display"
                        style={{
                          fontSize: span.big ? "clamp(32px, 3.8vw, 52px)" : 24,
                          fontWeight: 400,
                          color: "var(--ink-100)",
                          margin: 0,
                          marginBottom: 14,
                          lineHeight: 1.1,
                        }}
                      >
                        {p.title}
                      </h3>
                      <p
                        style={{
                          fontSize: span.big ? 16.5 : 14,
                          color: "var(--ink-70)",
                          margin: 0,
                          lineHeight: 1.6,
                          maxWidth: span.big ? 620 : "100%",
                          textWrap: "pretty",
                        }}
                      >
                        {short}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: 26,
                          gap: 16,
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                        >
                          {tech.slice(0, span.big ? 4 : 3).map((t) => (
                            <span
                              key={t}
                              className="chip"
                              style={{ fontSize: 10 }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <span
                          style={{
                            fontFamily: "var(--font-serif)",
                            fontStyle: "italic",
                            fontSize: 15,
                            color: "var(--sn-pink)",
                          }}
                        >
                          View details →
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {/* Archive */}
          <div style={{ marginTop: 140 }}>
            <div
              className="reveal"
              style={{
                display: "flex",
                alignItems: "end",
                justifyContent: "space-between",
                marginBottom: 36,
                flexWrap: "wrap",
                gap: 20,
              }}
            >
              <div>
                <div className="label-mono" style={{ marginBottom: 10 }}>
                  All projects
                </div>
                <div
                  className="display"
                  style={{
                    fontSize: "clamp(32px, 3.4vw, 48px)",
                    fontWeight: 400,
                    color: "var(--ink-100)",
                  }}
                >
                  {filtered.length}{" "}
                  <em className="italic" style={{ color: "var(--ink-70)" }}>
                    in total
                  </em>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                {allTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilter(t)}
                    className={"chip " + (filter === t ? "on" : "")}
                    style={{ cursor: "pointer" }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="reveal"
              style={{ borderTop: "1px solid var(--rule)" }}
            >
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: "80px 4px",
                    textAlign: "center",
                    color: "var(--ink-60)",
                  }}
                >
                  No projects match this filter yet.
                </div>
              ) : (
                filtered.map((p) => (
                  <ArchiveRow
                    key={p.id}
                    p={p}
                    onClick={() => goToProject(p)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 880px) {
          [data-feat] > :global(*) {
            grid-column: span 12 !important;
            grid-row: span 1 !important;
            min-height: 260px !important;
          }
        }
      `}</style>
    </>
  );
}

function ArchiveRow({ p, onClick }) {
  const tech = normalizeTech(p.techStack);
  const tag = primaryTag(p.tags);
  const status = formatStatus(p.status);
  const short = p.shortDescription || p.description || "";

  return (
    <a
      href={`/projects/${p.slug || p.id}`}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(0, 2.4fr) minmax(0, 0.9fr) minmax(0, 1.3fr) 140px 40px",
        gap: 24,
        alignItems: "start",
        padding: "28px 4px",
        borderBottom: "1px solid var(--rule)",
        textDecoration: "none",
        transition: "background 0.3s var(--ease-out-expo), padding-left 0.3s var(--ease-out-expo)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(180, 220, 255, 0.03)";
        e.currentTarget.style.paddingLeft = "24px";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.paddingLeft = "4px";
      }}
      data-row
    >
      <div>
        <div
          className="display"
          style={{
            fontSize: "clamp(20px, 1.9vw, 26px)",
            color: "var(--ink-100)",
            marginBottom: 6,
            fontWeight: 400,
          }}
        >
          {p.title}
        </div>
        <div
          style={{
            fontSize: 14.5,
            color: "var(--ink-70)",
            lineHeight: 1.5,
            textWrap: "pretty",
          }}
        >
          {short}
        </div>
      </div>
      <div className="label-mono">{tag}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {tech.slice(0, 3).map((t) => (
          <span key={t} className="chip" style={{ fontSize: 10 }}>
            {t}
          </span>
        ))}
      </div>
      <div>
        <span
          className={"chip " + (status === "Completed" ? "on" : "")}
          style={{ fontSize: 10 }}
        >
          {status}
        </span>
      </div>
      <div
        aria-hidden="true"
        style={{
          textAlign: "right",
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          color: "var(--sn-pink)",
          fontSize: 22,
        }}
      >
        →
      </div>

      <style jsx>{`
        @media (max-width: 880px) {
          [data-row] {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          [data-row] > :global(*:nth-child(5)) {
            display: none;
          }
        }
      `}</style>
    </a>
  );
}

export async function getStaticProps() {
  try {
    const projectsRaw = await prisma.project.findMany({
      where: { status: { not: "Draft" } },
      orderBy: { startDate: "desc" },
      include: { teamMembers: true },
    });

    const projects = transformProjectsToApiFormat(projectsRaw);

    return {
      props: { projects: JSON.parse(JSON.stringify(projects)) },
      revalidate: 60,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error in getStaticProps:", error);
    }
    return {
      props: { projects: [] },
      revalidate: 60,
    };
  }
}
