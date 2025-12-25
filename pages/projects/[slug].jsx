import { useRouter } from "next/router";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import prisma from "../../lib/prisma.js";
import { transformProjectToApiFormat } from "../../lib/utils/projectTransformer.js";
import SEO from "@/components/SEO";
import ProjectDetail from "@/components/Project/ProjectDetail";

const ProjectDetailPage = ({ project, error }) => {
  const router = useRouter();

  // Handle fallback state - page is being generated
  if (router.isFallback) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading project...</p>
      </Container>
    );
  }

  // Handle error or missing project
  if (error || !project) {
    return (
      <Container className="my-5">
        <SEO title="Project Not Found" />
        <div className="text-center">
          <h1>Project Not Found</h1>
          <p>The project you're looking for doesn't exist.</p>
          <a href="/projects">← Back to Projects</a>
        </div>
      </Container>
    );
  }

  return (
    <>
      <SEO
        title={project.title}
        description={project.shortDescription || project.description || ""}
        image={project.images && project.images[0] ? project.images[0] : undefined}
      />
      <ProjectDetail project={project} />
    </>
  );
};

export async function getStaticPaths() {
  try {
    // Get all non-Draft projects (with and without slugs) - match the listing page filter
    const projects = await prisma.project.findMany({
      where: {
        status: {
          not: "Draft",
        },
      },
      select: {
        slug: true,
        id: true,
      },
    });

    // Create paths for projects with slugs and IDs (for projects without slugs)
    const paths = projects
      .map((project) => {
        // Use slug if available, otherwise use ID
        return project.slug 
          ? { params: { slug: project.slug } }
          : { params: { slug: project.id } };
      })
      .filter((path) => path.params.slug); // Filter out any null/undefined slugs

    return {
      paths,
      fallback: "blocking", // Generate pages on-demand if not found
    };
  } catch (error) {
    console.error("Error generating static paths:", error);
    return {
      paths: [],
      fallback: "blocking",
    };
  }
}

export async function getStaticProps({ params }) {
  try {
    const { slug } = params;

    if (!slug) {
      console.warn("getStaticProps: No slug provided");
      return {
        notFound: true,
      };
    }

    console.log(`getStaticProps: Looking for project with slug/id: ${slug}`);

    let project = null;

    // Try to find by slug first (if the parameter is a slug)
    project = await prisma.project.findUnique({
      where: { slug },
      include: {
        teamMembers: true,
      },
    });

    if (project) {
      console.log(`getStaticProps: Found project by slug: ${project.id}, status: ${project.status}`);
    }

    // If not found by slug, try by ID (parameter might be an ID for projects without slugs)
    if (!project) {
      console.log(`getStaticProps: Not found by slug, trying by ID: ${slug}`);
      project = await prisma.project.findUnique({
        where: { id: slug },
        include: {
          teamMembers: true,
        },
      });

      if (project) {
        console.log(`getStaticProps: Found project by ID: ${project.id}, status: ${project.status}`);
      }
    }

    // If still not found, return 404
    if (!project) {
      console.warn(`getStaticProps: Project not found with slug/id: ${slug}`);
      return {
        notFound: true,
      };
    }

    // Check if project is not Draft (match the listing page filter)
    if (project.status === "Draft") {
      console.warn(`getStaticProps: Project found but is Draft (status: ${project.status}): ${slug}`);
      return {
        notFound: true,
      };
    }

    const transformedProject = transformProjectToApiFormat(project);

    console.log(`getStaticProps: Successfully loaded project: ${transformedProject.title}`);

    return {
      props: {
        project: JSON.parse(JSON.stringify(transformedProject)),
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("getStaticProps: Error fetching project:", error);
    console.error("getStaticProps: Error stack:", error.stack);
    return {
      notFound: true,
    };
  }
}

export default ProjectDetailPage;

