/**
 * ProjectDetailV2 — Liquid Heat preview, case-study layout
 *
 * Replaces the six-identical-p-8-rounded-xl panel stack from the audit
 * with editorial structure: a single oversized folio numeral bleeding
 * off the right edge, italic display title, drop-cap opening paragraph,
 * a single gold pull quote at the moment of stillness, tech stack and
 * tags as inline metadata (not pills), hairline rules between sections.
 *
 * Section is wrapped in `cooling-zone-deep` so --color-primary cools to
 * oxblood and glow shadows are extinguished — the audit kill list flagged
 * "glow on every interactive element" and we honor that here.
 */

import type { CSSProperties, ReactNode } from "react";

interface ProjectV2Like {
  title: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  startDate: string | Date;
  releaseDate?: string | Date | null;
  status?: string | null;
  techStack?: unknown;
  tags?: unknown;
  pullQuote?: string;
}

interface ProjectDetailV2Props {
  project: ProjectV2Like;
}

function asStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) =>
        typeof v === "string"
          ? v
          : typeof v === "object" && v !== null && "name" in v
            ? String((v as { name?: unknown }).name ?? "")
            : ""
      )
      .filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return asStringArray(parsed);
    } catch {
      return [value];
    }
  }
  return [];
}

function formatStartYear(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return Number.isNaN(d.getTime()) ? "—" : String(d.getUTCFullYear());
}

function paragraphsFromMarkdown(md: string): string[] {
  return md
    .replace(/\\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function CaseStudySection({
  label,
  children,
  style,
}: {
  label: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section className="grid grid-cols-12 gap-6 sm:gap-8 lg:gap-10" style={style}>
      <div className="col-span-12 md:col-span-3">
        <div className="temp-label" style={{ color: "var(--color-stillness)" }}>
          {label}
        </div>
      </div>
      <div className="col-span-12 md:col-span-9">{children}</div>
    </section>
  );
}

export default function ProjectDetailV2({ project }: ProjectDetailV2Props) {
  const startYear = formatStartYear(project.startDate);
  const techStack = asStringArray(project.techStack);
  const tags = asStringArray(project.tags);

  const longDesc = project.longDescription || project.shortDescription || "";
  const paragraphs = paragraphsFromMarkdown(longDesc);

  // Pull quote — quoted verbatim from the longDescription if not given,
  // selecting the sentence that best names the thesis. Safest synthesis:
  // pull the data-leakage sentence, which is the project's central claim.
  const pullQuote =
    project.pullQuote ||
    "Existing benchmarks suffer from data leakage — models might perform well just by memorizing training data rather than actually learning how to do program repair.";

  // Body paragraphs, minus any sentence we lifted into the pull quote so
  // the reader isn't seeing the same line twice. (Cheap dedupe — fine for
  // a comp.)
  const cleanedParagraphs = paragraphs.map((p) =>
    p.includes("data leakage")
      ? p.replace(
          /Existing benchmarks like QuixBugs and SWE-Bench suffer from data leakage, which means models might perform well just by memorizing training data rather than actually learning how to do program repair\.\s*/i,
          ""
        )
      : p
  );

  return (
    <section
      className="cooling-zone-deep relative overflow-hidden"
      aria-label={`Case study: ${project.title}`}
      style={{
        // Hard transition out of the hero's heat. The body sets the bg
        // through `cooling-zone-deep` already; this is belt-and-suspenders.
        backgroundColor: "var(--color-cooling-end)",
        color: "var(--color-text-primary)",
      }}
    >
      {/* Top hairline marking the heat boundary. */}
      <hr
        className="border-0"
        style={{
          height: 1,
          background:
            "linear-gradient(90deg, transparent, var(--color-heat-bright) 30%, var(--color-heat-peak) 50%, var(--color-heat-bright) 70%, transparent)",
          opacity: 0.6,
          margin: 0,
        }}
      />

      {/* The folio numeral bleeds off the right edge. Translates +18% on
          x so a sliver of the digit sits past the viewport — intentional
          cropping per the Liquid Heat type rules. */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          top: "9rem",
          right: 0,
          transform: "translateX(18%)",
          zIndex: 0,
          opacity: 0.62,
        }}
        aria-hidden="true"
      >
        <div className="folio-numeral">{startYear}</div>
      </div>

      <div className="relative z-10 px-6 sm:px-12 lg:px-20 pt-32 pb-32">
        <div className="max-w-[78rem] mx-auto">
          {/* Folio metadata — left column, small caps. Replaces the
              StatusBadge filled-circle pattern from the audit kill list. */}
          <div className="flex flex-wrap items-baseline gap-x-10 gap-y-2 mb-12">
            <div>
              <div className="temp-label" style={{ color: "var(--color-stillness)" }}>
                Folio · No 04
              </div>
              <div
                className="font-condensed mt-2"
                style={{
                  fontSize: "1.5rem",
                  letterSpacing: "0.05em",
                  color: "var(--color-text-secondary)",
                }}
              >
                {startYear} →
              </div>
            </div>
            <div>
              <div className="temp-label" style={{ color: "var(--color-stillness)" }}>
                State
              </div>
              <div
                className="font-display-italic mt-2"
                style={{
                  fontSize: "1.25rem",
                  color: "var(--color-text-primary)",
                }}
              >
                {project.status === "InProgress"
                  ? "In progress · still cooling"
                  : project.status === "Published"
                    ? "Released"
                    : "Drafting"}
              </div>
            </div>
            <div>
              <div className="temp-label" style={{ color: "var(--color-stillness)" }}>
                Reading temp
              </div>
              <div
                className="font-condensed mt-2"
                style={{
                  fontSize: "1.5rem",
                  letterSpacing: "0.05em",
                  color: "var(--color-heat-mid)",
                }}
              >
                900 K
              </div>
            </div>
          </div>

          {/* Case-study title — italic display, allowed to wrap and break
              the column width. Not centered. */}
          <h2
            className="font-display-italic"
            style={{
              fontSize: "clamp(2.75rem, 7vw, 6rem)",
              lineHeight: 0.96,
              letterSpacing: "-0.02em",
              maxWidth: "22ch",
              margin: "0 0 0 -0.04em",
              color: "var(--color-text-primary)",
            }}
          >
            {project.title}
          </h2>

          {project.shortDescription && (
            <p
              className="font-body-neutral body-measure mt-10"
              style={{
                fontSize: "1.25rem",
                color: "var(--color-text-secondary)",
                lineHeight: 1.45,
              }}
            >
              {project.shortDescription.trim()}
            </p>
          )}

          <hr className="heat-rule" />

          {/* The case study itself. First paragraph carries the drop cap.
              No panel containers; only typography and hairlines. */}
          <CaseStudySection label="The work">
            <div className="space-y-6">
              {cleanedParagraphs.map((p, i) => (
                <p
                  key={i}
                  className={`font-body-neutral body-measure ${i === 0 ? "drop-cap" : ""}`}
                  style={{
                    fontSize: "1.0625rem",
                    color: "rgba(250, 250, 250, 0.85)",
                  }}
                >
                  {p}
                </p>
              ))}
            </div>
          </CaseStudySection>

          {/* Pull quote — gold, italic display, oversized. The single
              moment of stillness on this page. */}
          <figure className="my-24 sm:my-32 max-w-[64rem]">
            <blockquote
              className="font-display-italic"
              style={{
                fontSize: "var(--text-pullquote)",
                lineHeight: 1.02,
                letterSpacing: "-0.02em",
                color: "var(--color-stillness)",
                margin: 0,
                padding: 0,
                textWrap: "balance",
              }}
            >
              <span aria-hidden="true" style={{ marginRight: "0.05em" }}>
                “
              </span>
              {pullQuote}
              <span aria-hidden="true">”</span>
            </blockquote>
            <figcaption
              className="font-condensed mt-6"
              style={{
                fontSize: "0.85rem",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
              }}
            >
              Project thesis
            </figcaption>
          </figure>

          <CaseStudySection label="Method">
            <p
              className="font-body-neutral body-measure"
              style={{
                fontSize: "1.0625rem",
                color: "rgba(250, 250, 250, 0.85)",
              }}
            >
              Each model attempts to fix every other model&apos;s bugs, giving us insight into
              self-repair bias and how well models hold up against one another. Repair success is
              measured with the pass@k estimator across multiple values of k.
            </p>
          </CaseStudySection>

          <hr className="heat-rule" />

          {/* Tech stack as inline metadata, not pills. Bullet separators,
              small caps. The audit explicitly killed the chip pattern. */}
          {techStack.length > 0 && (
            <CaseStudySection label="Stack">
              <p
                className="font-condensed"
                style={{
                  fontSize: "1.05rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                {techStack.map((t, i) => (
                  <span key={t}>
                    {i > 0 && (
                      <span
                        aria-hidden="true"
                        style={{
                          margin: "0 0.85em",
                          color: "var(--color-heat-mid)",
                        }}
                      >
                        ·
                      </span>
                    )}
                    {t}
                  </span>
                ))}
              </p>
            </CaseStudySection>
          )}

          {tags.length > 0 && (
            <div className="mt-16">
              <span className="temp-label" style={{ color: "var(--color-stillness)" }}>
                Filed under{" "}
              </span>
              <span
                className="font-display-italic"
                style={{
                  fontSize: "1.15rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                {tags.join(" · ")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom hairline — final cooling boundary. */}
      <hr
        className="border-0"
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(106,4,15,0.6), transparent)",
          margin: 0,
        }}
      />
    </section>
  );
}
