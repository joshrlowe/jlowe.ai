/**
 * Home Page
 *
 * Portfolio-focused landing page featuring:
 * - Three.js space background
 * - Hero section with typing animation
 * - Recent activity timeline
 * - Featured projects
 * - GitHub contribution graph
 */

import dynamic from "next/dynamic";
import prisma from "../lib/prisma.js";
import { transformProjectsToApiFormat } from "../lib/utils/projectTransformer.js";
import SEO from "@/components/SEO";
import HeroSection from "@/components/HeroSection";
import FeaturedProjects from "@/components/FeaturedProjects";
import RecentActivity from "@/components/RecentActivity";

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

      {/* Main Content - Fixed section order */}
      <div className="relative z-10">
        {/* 1. Hero - Who I am */}
        <HeroSection
          data={welcomeData}
          homeContent={homeContent}
        />

        {/* 2. Recent Activity - Timeline of work */}
        <RecentActivity projects={safeProjects} articles={safeResources} />

        {/* 3. Featured Projects - What I've built */}
        <FeaturedProjects projects={safeProjects} />

        {/* 4. GitHub Contributions - Proof of consistent work */}
        <GitHubContributionGraph 
          username={githubUsername || "joshrlowe"} 
          title={homeContent?.githubSectionTitle}
          description={homeContent?.githubSectionDescription}
        />
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
  githubSectionTitle: "GitHub Contributions",
  githubSectionDescription:
    "A visual representation of my coding journey. Every square represents a day of building, learning, and shipping.",
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
        resources: [],
        homeContent: defaultHomeContent,
        githubUsername: "joshrlowe",
      },
      revalidate: 60,
    };
  }
}
