/**
 * Home Page
 *
 * Portfolio-focused landing page featuring:
 * - Three.js space background
 * - Hero section with typing animation
 * - GitHub contribution graph (shows coding activity)
 * - Featured projects (portfolio focus - ABOVE services)
 * - Recent activity timeline
 * - Services showcase (consulting - secondary)
 * - Stats and tech stack
 */

import dynamic from "next/dynamic";
import prisma from "../lib/prisma.js";
import { transformProjectsToApiFormat } from "../lib/utils/projectTransformer.js";
import SEO from "@/components/SEO";
import HeroSection from "@/components/HeroSection";
import FeaturedProjects from "@/components/FeaturedProjects";
import RecentActivity from "@/components/RecentActivity";
import ServicesSection from "@/components/ServicesSection";
import QuickStats from "@/components/QuickStats";
import TechStackShowcase from "@/components/TechStackShowcase";

// Dynamically import GitHubContributionGraph (uses client-only library)
const GitHubContributionGraph = dynamic(
  () => import("@/components/GitHubContributionGraph"),
  {
    ssr: false,
    loading: () => (
      <div className="py-24">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    ),
  }
);

// Note: AnimatedBackground, Welcome, WelcomeCTAs, ScrollIndicator, and SkillsTimeline
// have been replaced by SpaceBackground, HeroSection, and ServicesSection

// Dynamically import Three.js background for performance
const SpaceBackground = dynamic(() => import("@/components/SpaceBackground"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-0 bg-[var(--color-bg-space)]" />
  ),
});

export default function Home({
  welcomeData,
  projects,
  aboutData,
  contactData,
  resources,
  homeContent,
  githubUsername,
}) {
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeResources = Array.isArray(resources) ? resources : [];

  return (
    <>
      <SEO
        title="Josh Lowe - AI/ML Engineer | Portfolio"
        description={
          welcomeData?.briefBio ||
          "AI/ML Engineer building production-grade intelligent systems. View my projects, experience, and technical expertise."
        }
      />

      {/* Three.js Space Background */}
      <SpaceBackground />

      {/* Main Content - Portfolio-first ordering */}
      <div className="relative z-10">
        {/* 1. Hero - Who I am */}
        <HeroSection
          data={welcomeData}
          contactData={contactData}
          homeContent={homeContent}
        />

        {/* 2. GitHub Activity - Proof of consistent work */}
        <GitHubContributionGraph username={githubUsername || "joshrlowe"} />

        {/* 3. Featured Projects - What I've built (PORTFOLIO FOCUS) */}
        <FeaturedProjects projects={safeProjects} />

        {/* 4. Recent Activity - Timeline of work */}
        <RecentActivity projects={safeProjects} articles={safeResources} />

        {/* 5. Services - What I can do for you (CONSULTING) */}
        <ServicesSection homeContent={homeContent} />

        {/* 6. Stats & Tech - Credibility */}
        <QuickStats projects={safeProjects} aboutData={aboutData} />
        <TechStackShowcase projects={safeProjects} />
      </div>
    </>
  );
}

// Default home content (used as fallback)
const defaultHomeContent = {
  typingIntro: "I build...",
  heroTitle: "intelligent AI systems",
  typingStrings: [
    "intelligent AI systems",
    "production ML pipelines",
    "custom LLM solutions",
    "scalable data platforms",
    "next-gen applications",
  ],
  primaryCta: { text: "Start a Project", href: "/contact" },
  secondaryCta: { text: "View My Work", href: "/projects" },
  techBadges: [
    { name: "Python", color: "#E85D04" },
    { name: "TensorFlow", color: "#FAA307" },
    { name: "React", color: "#4CC9F0" },
    { name: "AWS", color: "#F48C06" },
    { name: "LLMs", color: "#F72585" },
  ],
  servicesTitle: "AI & Engineering Services",
  servicesSubtitle:
    "From strategy to implementation, I help businesses harness the power of AI and modern engineering practices.",
  services: [
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
  ],
};

export async function getStaticProps() {
  try {
    const welcomeData = await prisma.welcome.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const projectsRaw = await prisma.project.findMany({
      where: { status: "Published" },
      orderBy: { startDate: "desc" },
      include: { teamMembers: true },
      take: 20,
    });

    const projects = transformProjectsToApiFormat(projectsRaw);

    const aboutData = await prisma.about.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const contactData = await prisma.contact.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const resources = await prisma.post.findMany({
      where: { status: "Published" },
      orderBy: { datePublished: "desc" },
      take: 5,
    });

    // Fetch home page content
    const pageContent = await prisma.pageContent.findUnique({
      where: { pageKey: "home" },
    });

    // Merge with defaults
    const homeContent = pageContent?.content
      ? { ...defaultHomeContent, ...pageContent.content }
      : defaultHomeContent;

    const serialize = (data) => {
      try {
        return JSON.parse(JSON.stringify(data));
      } catch (error) {
        console.error("Serialization error:", error);
        return data;
      }
    };

    // Extract GitHub username from contact data
    const githubUrl = contactData?.socialMediaLinks?.github || "";
    const githubUsername = githubUrl.split("/").filter(Boolean).pop() || "joshrlowe";

    return {
      props: {
        welcomeData: welcomeData ? serialize(welcomeData) : null,
        projects: serialize(projects || []),
        aboutData: aboutData ? serialize(aboutData) : null,
        contactData: contactData ? serialize(contactData) : null,
        resources: serialize(resources || []),
        homeContent: serialize(homeContent),
        githubUsername,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error in getStaticProps:", error);
    return {
      props: {
        welcomeData: null,
        projects: [],
        aboutData: null,
        contactData: null,
        resources: [],
        homeContent: defaultHomeContent,
        githubUsername: "joshrlowe",
      },
      revalidate: 60,
    };
  }
}
