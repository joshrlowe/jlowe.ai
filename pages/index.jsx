import dynamic from "next/dynamic";
import prisma from "../lib/prisma.js";
import { transformProjectsToApiFormat } from "../lib/utils/projectTransformer.js";
import SEO from "@/components/SEO";
import Welcome from "@/components/Welcome";
import AnimatedBackground from "@/components/AnimatedBackground";

// Dynamically import components that use GSAP ScrollTrigger (client-side only)
const FeaturedProjectsDynamic = dynamic(() => import("@/components/FeaturedProjects"), {
  ssr: false,
  loading: () => <div style={{ minHeight: '200px' }} />,
});

const QuickStatsDynamic = dynamic(() => import("@/components/QuickStats"), {
  ssr: false,
  loading: () => <div style={{ minHeight: '200px' }} />,
});

const TechStackShowcaseDynamic = dynamic(() => import("@/components/TechStackShowcase"), {
  ssr: false,
  loading: () => <div style={{ minHeight: '200px' }} />,
});

const RecentResourcesDynamic = dynamic(() => import("@/components/RecentResources"), {
  ssr: false,
  loading: () => <div style={{ minHeight: '200px' }} />,
});

const GitHubActivityDynamic = dynamic(() => import("@/components/GitHubActivity"), {
  ssr: false,
  loading: () => <div style={{ minHeight: '200px' }} />,
});

const SkillsTimelineDynamic = dynamic(() => import("@/components/SkillsTimeline"), {
  ssr: false,
  loading: () => <div style={{ minHeight: '200px' }} />,
});

export default function Home({ welcomeData, projects, aboutData, contactData, resources }) {
  const githubUrl = contactData?.socialMediaLinks?.github || null;
  
  // Ensure arrays are always arrays to prevent errors
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeResources = Array.isArray(resources) ? resources : [];

  return (
    <>
      <SEO
        title="Josh Lowe - Full Stack Developer"
        description={welcomeData?.briefBio || "Full stack developer specializing in modern web technologies."}
      />
      <AnimatedBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Welcome data={welcomeData} contactData={contactData} />
        <FeaturedProjectsDynamic projects={safeProjects} />
        <QuickStatsDynamic projects={safeProjects} aboutData={aboutData} />
        <TechStackShowcaseDynamic projects={safeProjects} />
        <RecentResourcesDynamic resources={safeResources} />
        {githubUrl && <GitHubActivityDynamic githubUrl={githubUrl} />}
        <SkillsTimelineDynamic projects={safeProjects} />
      </div>
    </>
  );
}

export async function getStaticProps() {
  try {
    // Fetch welcome data
    const welcomeData = await prisma.welcome.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fetch projects (we'll filter featured on the client side, but we can optimize later)
    const projectsRaw = await prisma.project.findMany({
      where: {
        status: "Published",
      },
      orderBy: {
        startDate: "desc",
      },
      include: {
        teamMembers: true,
      },
      take: 20, // Limit to recent 20 projects for performance
    });

    // Transform projects to match API format
    const projects = transformProjectsToApiFormat(projectsRaw);

    // Fetch about data for stats
    const aboutData = await prisma.about.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fetch contact data for social links
    const contactData = await prisma.contact.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fetch recent posts (previously called resources)
    const resources = await prisma.post.findMany({
      where: {
        status: "Published",
      },
      orderBy: {
        datePublished: "desc",
      },
      take: 5,
    });

    // Serialize all data to remove Date objects and make it JSON-safe
    // Use try-catch to handle any serialization errors
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
      },
      // Revalidate every 60 seconds for ISR
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
      },
      revalidate: 60,
    };
  }
}
