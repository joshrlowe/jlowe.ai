/**
 * ServicesSection.jsx
 *
 * SUPERNOVA v2.1 - AI Consulting Services
 *
 * Features:
 * - Editable via admin panel (homeContent)
 * - Space Grotesk typography
 * - Refined ember color palette with cool accent
 * - 3D tilt cards with glow effects
 * - GSAP scroll-triggered animations
 *
 * Refactoring: Icons extracted to components/icons/ServiceIcons.jsx
 */

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Card, Badge } from "@/components/ui";
import { getServiceIcon } from "@/components/icons";
import { COLOR_VARIANTS } from "@/lib/utils/constants";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Default services (used if no homeContent provided)
const defaultServices = [
  {
    iconKey: "computer",
    title: "AI Strategy & Consulting",
    description:
      "Transform your business with data-driven AI strategies. I help organizations identify opportunities and build roadmaps for AI adoption.",
    variant: "primary",
  },
  {
    iconKey: "database",
    title: "Machine Learning Systems",
    description:
      "End-to-end ML pipeline development—from data engineering to model deployment. Scalable, production-ready solutions.",
    variant: "accent",
  },
  {
    iconKey: "code",
    title: "LLM & GenAI Solutions",
    description:
      "Custom Large Language Model integrations, RAG systems, and generative AI applications tailored to your needs.",
    variant: "cool",
  },
  {
    iconKey: "cloud",
    title: "Cloud & MLOps",
    description:
      "Deploy and scale AI systems on AWS, GCP, or Azure. Implement MLOps best practices for continuous improvement.",
    variant: "secondary",
  },
  {
    iconKey: "chart",
    title: "Data Analytics",
    description:
      "Turn raw data into actionable insights. Build dashboards, pipelines, and analytics systems that drive decisions.",
    variant: "primary",
  },
  {
    iconKey: "book",
    title: "Technical Training",
    description:
      "Upskill your team with hands-on AI/ML training. Workshops tailored to your tech stack and business goals.",
    variant: "accent",
  },
];


export default function ServicesSection({ homeContent }) {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);
  const titleRef = useRef(null);

  // Get content from props or use defaults
  // Only use defaults if homeContent doesn't exist at all
  // If user explicitly set empty array, respect that choice
  const servicesTitle =
    homeContent?.servicesTitle || "AI & Engineering Services";
  const servicesSubtitle =
    homeContent?.servicesSubtitle ||
    "From strategy to implementation, I help businesses harness the power of AI and modern engineering practices.";
  const services =
    homeContent?.services !== undefined ? homeContent.services : defaultServices;

  useEffect(() => {
    // Skip animations if no services or no section ref
    if (!sectionRef.current || services.length === 0) return;

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

    // Animate cards with stagger
    cardsRef.current.forEach((card, index) => {
      if (!card) return;

      gsap.fromTo(
        card,
        { opacity: 0, y: 70, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
          delay: index * 0.1,
        },
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [services]);

  // If no services to display, don't render the section
  if (services.length === 0) {
    return null;
  }

  return (
    <section
      id="services"
      ref={sectionRef}
      className="py-32 relative z-10"
      aria-labelledby="services-title"
    >
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20" ref={titleRef}>
          {/* Badge */}
          <Badge variant="accent" size="lg" className="mb-8">
            What I Do
          </Badge>

          {/* Title - Premium typography */}
          <h2
            id="services-title"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 tracking-tight"
            style={{
              fontFamily: "var(--font-family-heading)",
              background:
                "linear-gradient(135deg, #FAFAFA 0%, #E85D04 60%, #9D0208 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {servicesTitle}
          </h2>

          <p
            className="text-lg sm:text-xl mx-auto leading-relaxed"
            style={{
              color: "var(--color-text-secondary)",
              fontFamily: "var(--font-family-base)",
              maxWidth: "80%",
            }}
          >
            {servicesSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {services.map((service, index) => {
            const colors = COLOR_VARIANTS[service.variant] || COLOR_VARIANTS.primary;
            return (
              <Card
                key={service.title || index}
                ref={(el) => (cardsRef.current[index] = el)}
                variant={service.variant}
                tilt
                interactive
                className="group"
              >
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                >
                  {getServiceIcon(service.iconKey)}
                </div>

                {/* Content */}
                <h3
                  className="text-xl font-semibold mb-4 tracking-tight"
                  style={{
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-family-heading)",
                  }}
                >
                  {service.title}
                </h3>
                <p
                  className="text-sm leading-relaxed mb-6"
                  style={{
                    color: "var(--color-text-secondary)",
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  {service.description}
                </p>

                {/* Hover indicator */}
                <div
                  className="flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ color: colors.text }}
                >
                  <span>Learn more</span>
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
