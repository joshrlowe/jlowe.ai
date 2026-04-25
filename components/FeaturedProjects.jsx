/**
 * FeaturedProjects.jsx
 *
 * Editorial Cool redesign — asymmetric 12-col featured grid (spans: 7/5/5/12),
 * rim-light cards, serif display titles, mono tag eyebrow + status chip.
 *
 * Data contract: projects[] from getStaticProps. Preserves Prisma JSON
 * fields (techStack, tags, images) via parseJsonField.
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { parseJsonField } from "@/lib/utils/jsonUtils";
import { getPrefersReducedMotion } from "@/lib/hooks";

const SPANS = [
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
  // Convert Prisma enum values like "InProgress" to "In Progress"
  return status.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export default function FeaturedProjects({ projects = [] }) {
  const router = useRouter();
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!sectionRef.current || projects.length === 0) return;

    if (getPrefersReducedMotion()) {
      sectionRef.current.querySelectorAll(".reveal").forEach((el) => {
        el.classList.add("in");
      });
      return;
    }

    const triggers = [];
    const revealEls = sectionRef.current.querySelectorAll(".reveal");
    revealEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) {
        el.classList.add("in");
      } else {
        const trigger = ScrollTrigger.create({
          trigger: el,
          start: "top 90%",
          onEnter: () => el.classList.add("in"),
          once: true,
        });
        triggers.push(trigger);
      }
    });

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, [projects]);

  if (!projects || projects.length === 0) return null;

  const featuredProjects = projects.filter((p) => p.featured).slice(0, 4);
  const displayProjects =
    featuredProjects.length > 0 ? featuredProjects : projects.slice(0, 4);

  const eyebrowTitle = (
    <>
      Selected <em className="italic">work</em>.
    </>
  );

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="section relative z-10"
      style={{ padding: "160px 0" }}
      aria-labelledby="projects-title"
    >
      <div className="container">
        {/* Section header */}
        <div className="reveal">
          <div className="eyebrow" style={{ marginBottom: 28 }}>
            <span className="num">02</span>
            <span className="bar" />
            <span>Projects</span>
          </div>
          <h2
            id="projects-title"
            className="display"
            style={{
              fontSize: "clamp(48px, 6.2vw, 104px)",
              margin: 0,
              marginBottom: 22,
              lineHeight: 0.98,
            }}
          >
            {eyebrowTitle}
          </h2>
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

        {/* Featured grid — asymmetric 12-col */}
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
          {displayProjects.map((project, i) => {
            const span = SPANS[i] || SPANS[SPANS.length - 1];
            const tech = normalizeTech(project.techStack);
            const tag = primaryTag(project.tags);
            const status = formatStatus(project.status);
            const short =
              project.shortDescription || project.description || "";
            const projectUrl = `/projects/${project.slug || project.id}`;

            return (
              <a
                key={project.id}
                href={projectUrl}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(projectUrl);
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
                aria-label={`View project: ${project.title}`}
              >
                {span.big && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "radial-gradient(circle at 78% 24%, rgba(34, 211, 238, 0.16), transparent 55%), radial-gradient(circle at 16% 84%, rgba(59, 130, 246, 0.18), transparent 50%)",
                      opacity: 0.95,
                      pointerEvents: "none",
                    }}
                    aria-hidden="true"
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
                    className={"chip " + (status === "Completed" ? "on" : "")}
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
                    {project.title}
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
      </div>

      <style jsx>{`
        @media (max-width: 880px) {
          [data-feat] > :global(*) {
            grid-column: span 12 !important;
            grid-row: span 1 !important;
            min-height: 260px !important;
          }
        }
      `}</style>
    </section>
  );
}
