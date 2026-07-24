import Link from "next/link";

import { ActivityStrip } from "@/components/activity-strip";
import { ContributionsPlaceholder } from "@/components/contributions-placeholder";
import { ProjectCard } from "@/components/project-card";
import { Section } from "@/components/section";
import { TypingTagline } from "@/components/typing-tagline";
import { Button } from "@/components/ui/button";
import { PROJECTS } from "@/data/projects";
import { TYPING_PHRASES } from "@/data/site";
import { getContributions } from "@/lib/github/contributions";

export default async function HomePage() {
  const featured = PROJECTS.filter((project) => project.featured);
  // Fetched at build time under `output: "export"`; falls back to the seeded
  // grid when GITHUB_TOKEN is absent (see lib/github/contributions).
  const contributions = await getContributions();

  return (
    <>
      <section className="py-20 md:py-28">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
          I build <TypingTagline phrases={TYPING_PHRASES} />
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground">
          AI engineer and consultant. I help teams ship AI systems that hold up
          in production — and I&apos;m currently rebuilding this site as an
          explorable 3D world.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/contact">Start a Project</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/projects">View My Work</Link>
          </Button>
        </div>
      </section>

      <Section title="Recent activity">
        <ActivityStrip />
      </Section>

      <Section title="Featured projects">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </Section>

      <Section
        title="GitHub contributions"
        description="A visual representation of my coding journey."
        className="pb-20"
      >
        <ContributionsPlaceholder data={contributions} />
      </Section>
    </>
  );
}
