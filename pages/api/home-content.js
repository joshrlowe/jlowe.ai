/**
 * Public API endpoint for home page content
 *
 * Returns editable content for the home page:
 * - Typing strings (hero animation)
 * - Hero title
 * - Tech badges
 * - Services
 * - CTA buttons
 */

import prisma from "../../lib/prisma.js";

// Default content structure
const defaultHomeContent = {
  // Hero section
  typingIntro: "I build...",
  heroTitle: "intelligent AI systems",
  typingStrings: [
    "intelligent AI systems",
    "production ML pipelines",
    "custom LLM solutions",
    "scalable data platforms",
    "next-gen applications",
  ],

  // CTA buttons
  primaryCta: {
    text: "Start a Project",
    href: "/contact",
  },
  secondaryCta: {
    text: "View My Work",
    href: "/projects",
  },

  // Tech badges displayed in hero
  techBadges: [
    { name: "Python", color: "#E85D04" },
    { name: "TensorFlow", color: "#FAA307" },
    { name: "React", color: "#4CC9F0" },
    { name: "AWS", color: "#F48C06" },
    { name: "LLMs", color: "#F72585" },
  ],

  // Services section
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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Try to get custom content from database
    const pageContent = await prisma.pageContent.findUnique({
      where: { pageKey: "home" },
    });

    if (pageContent?.content) {
      // Merge with defaults to ensure all fields exist
      const mergedContent = {
        ...defaultHomeContent,
        ...pageContent.content,
      };
      return res.json(mergedContent);
    }

    // Return defaults if no custom content exists
    return res.json(defaultHomeContent);
  } catch (error) {
    console.error("Error fetching home content:", error);
    // Return defaults on error
    return res.json(defaultHomeContent);
  }
}
