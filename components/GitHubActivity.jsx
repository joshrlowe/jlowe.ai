/**
 * GitHubActivity.jsx
 *
 * SUPERNOVA v2.0 - GitHub Repositories
 *
 * Features:
 * - Space Grotesk typography
 * - Refined ember color palette with cool accent
 * - Live API fetch
 * - GSAP animations
 */

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Badge } from "@/components/ui";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function GitHubActivity({ githubUrl }) {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    if (!githubUrl) return;

    const fetchGitHubActivity = async () => {
      try {
        const username = githubUrl.split("/").pop();
        const response = await fetch(
          `https://api.github.com/users/${username}/repos?sort=updated&per_page=6`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch GitHub activity");
        }

        const data = await response.json();
        setRepos(data.filter((repo) => !repo.fork).slice(0, 4));
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchGitHubActivity();
  }, [githubUrl]);

  useEffect(() => {
    if (!sectionRef.current || repos.length === 0) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    // Animate title
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        },
      );
    }

    cardsRef.current.forEach((card, index) => {
      if (!card) return;

      gsap.fromTo(
        card,
        { opacity: 0, x: -40 },
        {
          opacity: 1,
          x: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          delay: index * 0.12,
        },
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [repos]);

  if (!githubUrl) return null;

  // Loading state
  if (loading) {
    return (
      <section
        className="py-28 relative z-10"
        style={{ background: "rgba(4, 4, 4, 0.6)" }}
      >
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="cool" size="lg" className="mb-8">
              Open Source
            </Badge>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
              style={{
                fontFamily: "var(--font-family-heading)",
                background:
                  "linear-gradient(135deg, #FAFAFA 0%, #4CC9F0 60%, #4895EF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              GitHub Activity
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-xl animate-pulse"
                style={{
                  background: "rgba(12, 12, 12, 0.85)",
                  border: "1px solid rgba(76, 201, 240, 0.15)",
                }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || repos.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="py-28 relative z-10"
      style={{ background: "rgba(4, 4, 4, 0.6)" }}
      aria-label="GitHub activity"
    >
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-16" ref={titleRef}>
          <div>
            {/* Badge */}
            <Badge variant="cool" size="lg" className="mb-8">
              Open Source
            </Badge>

            {/* Title - Cool gradient for GitHub */}
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
              style={{
                fontFamily: "var(--font-family-heading)",
                background:
                  "linear-gradient(135deg, #FAFAFA 0%, #4CC9F0 60%, #4895EF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              GitHub Activity
            </h2>
          </div>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 font-semibold transition-all hover:gap-3"
            style={{
              color: "#4CC9F0",
              fontFamily: "var(--font-family-base)",
            }}
          >
            <span>View Profile</span>
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {repos.map((repo, index) => (
            <a
              key={repo.id}
              ref={(el) => (cardsRef.current[index] = el)}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col p-7 rounded-xl transition-all duration-300 hover:-translate-y-2"
              style={{
                background: "rgba(12, 12, 12, 0.92)",
                border: "1px solid rgba(76, 201, 240, 0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 0 35px rgba(76, 201, 240, 0.25)";
                e.currentTarget.style.borderColor = "#4CC9F0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "rgba(76, 201, 240, 0.15)";
              }}
            >
              <div className="flex items-start justify-between mb-5">
                {/* Repo icon */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{
                      background: "rgba(76, 201, 240, 0.12)",
                      color: "#4CC9F0",
                    }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                  </div>
                  <h3
                    className="text-lg font-semibold truncate tracking-tight transition-colors"
                    style={{
                      color: "var(--color-text-primary)",
                      fontFamily: "var(--font-family-heading)",
                    }}
                  >
                    {repo.name}
                  </h3>
                </div>

                {/* Stats */}
                <div
                  className="flex items-center gap-3 text-sm shrink-0"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      style={{ color: "#FAA307" }}
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
                    </svg>
                    {repo.stargazers_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 111.5 0v.878a2.25 2.25 0 01-2.25 2.25h-1.5v2.128a2.251 2.251 0 11-1.5 0V8.5h-1.5A2.25 2.25 0 013.5 6.25v-.878a2.25 2.25 0 111.5 0zM5 3.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0zm6.75.75a.75.75 0 100-1.5.75.75 0 000 1.5zm-3 8.75a.75.75 0 10-1.5 0 .75.75 0 001.5 0z" />
                    </svg>
                    {repo.forks_count}
                  </span>
                </div>
              </div>

              {/* Description */}
              {repo.description && (
                <p
                  className="text-sm mb-5 line-clamp-2 flex-grow leading-relaxed"
                  style={{
                    color: "var(--color-text-secondary)",
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  {repo.description}
                </p>
              )}

              {/* Footer */}
              <div
                className="flex items-center justify-between pt-5"
                style={{ borderTop: "1px solid rgba(76, 201, 240, 0.12)" }}
              >
                {repo.language && (
                  <Badge variant="accent" size="sm">
                    {repo.language}
                  </Badge>
                )}

                <span
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {new Date(repo.updated_at).toLocaleDateString()}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
