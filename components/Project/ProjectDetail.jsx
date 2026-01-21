import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import StatusBadge from "./StatusBadge";
import { parseJsonField } from "@/lib/utils/jsonUtils";
import { formatMonthYear } from "@/lib/utils/dateUtils";
import { getPrefersReducedMotion } from "@/lib/hooks";
import { ANIMATION } from "@/lib/utils/constants";

export default function ProjectDetail({ project }) {
  const headerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (getPrefersReducedMotion()) return;

    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: ANIMATION.DURATION_SLOW, ease: ANIMATION.EASE_DEFAULT },
      );
    }
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: ANIMATION.DURATION_SLOW, delay: 0.2, ease: ANIMATION.EASE_DEFAULT },
      );
    }
  }, []);

  const images = parseJsonField(project.images, []);
  const tags = parseJsonField(project.tags, []);
  const techStack = parseJsonField(project.techStack, []);
  const features = parseJsonField(project.features, []);
  const challenges = parseJsonField(project.challenges, []);
  const links = parseJsonField(project.links, {});

  return (
    <div className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        {/* Back Link */}
        <Link
          href="/projects"
          className="inline-flex items-center text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors mb-8"
        >
          ← Back to Projects
        </Link>

        {/* Header */}
        <header ref={headerRef} className="mb-12">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <StatusBadge status={project.status} />
            {project.featured && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-[var(--color-primary)] text-white">
                Featured
              </span>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--color-text-primary)] mb-4 font-heading">
            {project.title}
          </h1>

          {project.shortDescription && (
            <p className="text-xl text-[var(--color-text-secondary)] mb-6">
              {project.shortDescription}
            </p>
          )}

          <div className="flex flex-col gap-1 text-sm text-[var(--color-text-muted)]">
            {project.startDate && (
              <span>Started: {formatMonthYear(project.startDate)}</span>
            )}
            {project.releaseDate && (
              <span>Released: {formatMonthYear(project.releaseDate)}</span>
            )}
          </div>

          {/* Links */}
          {(links?.live || links?.github) && (
            <div className="flex flex-wrap gap-4 mt-6">
              {links?.live && (
                <a
                  href={links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  View Live →
                </a>
              )}
              {links?.github && (
                <a
                  href={links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  View Code →
                </a>
              )}
            </div>
          )}
        </header>

        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="mb-12">
            <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-xl overflow-hidden mb-4">
              <Image
                src={
                  typeof images[0] === "string"
                    ? images[0]
                    : images[0].url || images[0].src
                }
                alt={project.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.slice(1, 5).map((img, index) => (
                  <div
                    key={index}
                    className="relative h-24 rounded-lg overflow-hidden"
                  >
                    <Image
                      src={typeof img === "string" ? img : img.url || img.src}
                      alt={`${project.title} screenshot ${index + 2}`}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div ref={contentRef} className="space-y-12">
          {/* Description */}
          {(project.longDescription || project.description) && (
            <section className="p-8 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4 font-heading">
                About This Project
              </h2>
              <div className="prose prose-invert max-w-none text-[var(--color-text-secondary)] prose-headings:text-[var(--color-text-primary)] prose-a:text-[var(--color-primary)] prose-strong:text-[var(--color-text-primary)] prose-code:text-[var(--color-primary)] prose-code:bg-[var(--color-bg-darker)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[var(--color-bg-darker)]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {project.longDescription || project.description}
                </ReactMarkdown>
              </div>
            </section>
          )}

          {/* Tech Stack */}
          {techStack.length > 0 && (
            <section className="p-8 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4 font-heading">
                Tech Stack
              </h2>
              <div className="flex flex-wrap gap-3">
                {techStack.map((tech, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium"
                  >
                    {typeof tech === "string" ? tech : tech.name || tech}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Features */}
          {features.length > 0 && (
            <section className="p-8 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4 font-heading">
                Key Features
              </h2>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-[var(--color-text-secondary)]"
                  >
                    <span className="w-6 h-6 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <svg
                        className="w-3 h-3 text-[var(--color-primary)]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span>
                      {typeof feature === "string"
                        ? feature
                        : feature.name || feature.title}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Challenges */}
          {challenges.length > 0 && (
            <section className="p-8 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4 font-heading">
                Challenges & Solutions
              </h2>
              <div className="space-y-4">
                {challenges.map((challenge, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-[var(--color-bg-darker)]"
                  >
                    <p className="text-[var(--color-text-secondary)]">
                      {typeof challenge === "string"
                        ? challenge
                        : challenge.description || challenge.name}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm rounded-full bg-[var(--color-bg-card)] text-[var(--color-text-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Team */}
          {project.teamMembers && project.teamMembers.length > 0 && (
            <section className="p-8 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4 font-heading">
                Team
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {project.teamMembers.map((member, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-[var(--color-bg-darker)] text-center"
                  >
                    <div className="text-[var(--color-text-primary)] font-medium">
                      {member.name}
                    </div>
                    {member.role && (
                      <div className="text-sm text-[var(--color-text-muted)]">
                        {member.role}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
