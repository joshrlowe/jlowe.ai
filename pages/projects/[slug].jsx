import { useRouter } from "next/router";
import prisma from "../../lib/prisma.js";
import { transformProjectToApiFormat } from "../../lib/utils/projectTransformer.js";
import SEO from "@/components/SEO";
import ProjectDetail from "@/components/Project/ProjectDetail";
import Link from "next/link";

const ProjectDetailPage = ({ project, error }) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[var(--color-text-secondary)]">
            Loading project...
          </p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <SEO title="Project Not Found" />
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center">
              <svg
                className="w-10 h-10 text-[var(--color-text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">
              Project Not Found
            </h1>
            <p className="text-[var(--color-text-secondary)] mb-8">
              The project you're looking for doesn't exist.
            </p>
            <Link
              href="/projects"
              className="inline-flex items-center text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
            >
              ← Back to Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={project.title}
        description={project.shortDescription || project.description || ""}
        image={
          project.images && project.images[0] ? project.images[0] : undefined
        }
      />
      <ProjectDetail project={project} />
    </>
  );
};

export async function getStaticPaths() {
  try {
    const projects = await prisma.project.findMany({
      where: { status: { not: "Draft" } },
      select: { slug: true, id: true },
    });

    const paths = projects
      .map((project) => ({
        params: { slug: project.slug || project.id },
      }))
      .filter((path) => path.params.slug);

    return { paths, fallback: "blocking" };
  } catch (error) {
    console.error("Error generating static paths:", error);
    return { paths: [], fallback: "blocking" };
  }
}

export async function getStaticProps({ params }) {
  try {
    const { slug } = params;

    if (!slug) {
      return { notFound: true };
    }

    let project = await prisma.project.findUnique({
      where: { slug },
      include: { teamMembers: true },
    });

    if (!project) {
      project = await prisma.project.findUnique({
        where: { id: slug },
        include: { teamMembers: true },
      });
    }

    if (!project || project.status === "Draft") {
      return { notFound: true };
    }

    const transformedProject = transformProjectToApiFormat(project);

    return {
      props: { project: JSON.parse(JSON.stringify(transformedProject)) },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error fetching project:", error);
    return { notFound: true };
  }
}

export default ProjectDetailPage;
