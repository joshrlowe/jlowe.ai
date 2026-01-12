/**
 * RecentActivity.jsx
 *
 * Shows recent work activity: commits, projects, articles.
 * Demonstrates active engagement and consistency to recruiters.
 *
 * Features:
 * - Timeline-style layout
 * - Multiple activity types (project, article, commit)
 * - Supernova theme styling
 * - GSAP scroll animations
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Badge } from "@/components/ui";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Activity type configurations
const activityConfig = {
  project: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
    ),
    color: "#E85D04",
    label: "Project",
  },
  article: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    color: "#4CC9F0",
    label: "Article",
  },
  update: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    ),
    color: "#FAA307",
    label: "Update",
  },
};

function ActivityItem({ activity, index }) {
  const itemRef = useRef(null);
  const config = activityConfig[activity.type] || activityConfig.update;

  useEffect(() => {
    if (!itemRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    gsap.fromTo(
      itemRef.current,
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: itemRef.current,
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
        delay: index * 0.1,
      },
    );
  }, [index]);

  const formattedDate = new Date(activity.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const timeAgo = getTimeAgo(new Date(activity.date));

  return (
    <div ref={itemRef} className="relative flex gap-4 pb-8 last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-[19px] top-10 bottom-0 w-px bg-gradient-to-b from-[var(--color-border)] to-transparent" />

      {/* Icon */}
      <div
        className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: `${config.color}15`,
          border: `2px solid ${config.color}40`,
          color: config.color,
        }}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: `${config.color}15`,
                color: config.color,
              }}
            >
              {config.label}
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
              title={formattedDate}
            >
              {timeAgo}
            </span>
          </div>
        </div>

        {activity.href ? (
          <Link
            href={activity.href}
            className="text-base font-medium hover:text-[var(--color-primary)] transition-colors block mb-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            {activity.title}
          </Link>
        ) : (
          <p
            className="text-base font-medium mb-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            {activity.title}
          </p>
        )}

        {activity.description && (
          <p
            className="text-sm line-clamp-2"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {activity.description}
          </p>
        )}

        {activity.tags && activity.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {activity.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  background: "var(--color-surface)",
                  color: "var(--color-text-muted)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export default function RecentActivity({ projects = [], articles = [] }) {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    gsap.fromTo(
      titleRef.current,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      },
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  // Combine and sort activities by date
  const activities = [
    ...projects.slice(0, 5).map((p) => ({
      type: "project",
      title: p.title,
      description: p.shortDescription,
      date: p.releaseDate || p.startDate || p.createdAt,
      href: `/projects/${p.slug}`,
      tags: p.tags || [],
    })),
    ...articles.slice(0, 5).map((a) => ({
      type: "article",
      title: a.title,
      description: a.excerpt || a.description,
      date: a.datePublished || a.createdAt,
      href: `/articles/${a.topic}/${a.slug}`,
      tags: a.tags || [],
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  if (activities.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="recent-activity"
      className="py-24 relative z-10"
      aria-labelledby="activity-title"
    >
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={titleRef} className="text-center mb-12">
          <Badge variant="accent" size="lg" className="mb-6">
            What I&apos;ve Been Up To
          </Badge>

          <h2
            id="activity-title"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight"
            style={{
              fontFamily: "var(--font-family-heading)",
              color: "var(--color-text-primary)",
            }}
          >
            Recent Activity
          </h2>

          <p
            className="text-lg mx-auto leading-relaxed"
            style={{
              color: "var(--color-text-secondary)",
              maxWidth: "500px",
            }}
          >
            A timeline of my latest projects, articles, and updates.
          </p>
        </div>

        {/* Activity Timeline */}
        <div className="relative">
          {activities.map((activity, index) => (
            <ActivityItem key={`${activity.type}-${index}`} activity={activity} index={index} />
          ))}
        </div>

        {/* View All Links */}
        <div className="flex items-center justify-center gap-6 mt-12">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-[var(--color-primary)]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            All Projects
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-[var(--color-primary)]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            All Articles
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

