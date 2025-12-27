/**
 * Home Page
 *
 * Main landing page featuring:
 * - Three.js space background
 * - Hero section with typing animation
 * - Services showcase
 * - Featured projects
 * - Stats and testimonials
 */

import dynamic from "next/dynamic";
import prisma from "../lib/prisma.js";
import { transformProjectsToApiFormat } from "../lib/utils/projectTransformer.js";
import SEO from "@/components/SEO";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import FeaturedProjects from "@/components/FeaturedProjects";
import QuickStats from "@/components/QuickStats";
import TechStackShowcase from "@/components/TechStackShowcase";
import RecentResources from "@/components/RecentResources";
import GitHubActivity from "@/components/GitHubActivity";

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
}) {
  const githubUrl = contactData?.socialMediaLinks?.github || null;

  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeResources = Array.isArray(resources) ? resources : [];

  return (
    <>
      <SEO
        title="Josh Lowe - AI Engineer & Consultant"
        description={
          welcomeData?.briefBio ||
          "AI Engineer & Consultant building intelligent systems and production-grade AI applications."
        }
      />

      {/* Three.js Space Background */}
      <SpaceBackground />

      {/* Main Content */}
      <div className="relative z-10">
        <HeroSection
          data={welcomeData}
          contactData={contactData}
          homeContent={homeContent}
        />
        <ServicesSection homeContent={homeContent} />
        <FeaturedProjects projects={safeProjects} />
        <QuickStats projects={safeProjects} aboutData={aboutData} />
        <TechStackShowcase projects={safeProjects} />
        <RecentResources resources={safeResources} />
        {githubUrl && <GitHubActivity githubUrl={githubUrl} />}
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

    return {
      props: {
        welcomeData: welcomeData ? serialize(welcomeData) : null,
        projects: serialize(projects || []),
        aboutData: aboutData ? serialize(aboutData) : null,
        contactData: contactData ? serialize(contactData) : null,
        resources: serialize(resources || []),
        homeContent: serialize(homeContent),
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
      },
      revalidate: 60,
    };
  }
}
