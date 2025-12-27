import { getToken } from "next-auth/jwt";
import prisma from "../../../lib/prisma.js";
import { handleApiError } from "../../../lib/utils/apiErrorHandler.js";

export default async function handler(req, res) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const { pageKey } = req.query;

      if (!pageKey) {
        return res.status(400).json({ message: "pageKey is required" });
      }

      let pageContent = await prisma.pageContent.findUnique({
        where: { pageKey },
      });

      // Return default structure if page doesn't exist
      if (!pageContent) {
        const defaults = getDefaultContent(pageKey);
        res.json({ pageKey, content: defaults });
      } else {
        res.json(pageContent);
      }
    } catch (error) {
      handleApiError(error, res);
    }
  } else if (req.method === "PUT") {
    try {
      const { pageKey, content } = req.body;

      if (!pageKey || !content) {
        return res
          .status(400)
          .json({ message: "pageKey and content are required" });
      }

      const pageContent = await prisma.pageContent.upsert({
        where: { pageKey },
        update: { content },
        create: { pageKey, content },
      });

      res.json(pageContent);
    } catch (error) {
      handleApiError(error, res);
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}

function getDefaultContent(pageKey) {
  switch (pageKey) {
    case "home":
      return {
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
    case "about":
      return {
        bio: [],
        skills: [],
        resumeUrl: "",
      };
    case "contact":
      return {
        headline: "",
        body: "",
        email: "",
        phone: "",
        formRecipientEmail: "",
      };
    default:
      return {};
  }
}
