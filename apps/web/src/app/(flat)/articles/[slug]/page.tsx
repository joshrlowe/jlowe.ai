import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { BlogPosting, WithContext } from "schema-dts";

import { JsonLd } from "@/components/json-ld";
import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  entriesByKind,
  entryBySlug,
  paragraphs,
  summarize,
} from "@/lib/corpus";
import { SITE_NAME, siteUrl } from "@/lib/site-config";

// Static export: pre-render one page per corpus article slug; anything else 404s.
// Mirrors the projects/[slug] route (PR #121). Safe to ship because the corpus
// has >= 1 public article — an empty generateStaticParams fails `output: export`.
export const dynamic = "force-static";
export const dynamicParams = false;

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return entriesByKind("article").map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = entryBySlug("article", slug);
  if (!entry) return {};
  const description = summarize(entry);
  const canonical = `/articles/${entry.slug}/`;
  return {
    title: entry.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: entry.title,
      description,
      type: "article",
      url: canonical,
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const entry = entryBySlug("article", slug);
  if (!entry) notFound();

  const description = summarize(entry);
  const body = paragraphs(entry);

  const jsonLd: WithContext<BlogPosting> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: entry.title,
    description,
    url: `${siteUrl().origin}/articles/${entry.slug}/`,
    author: { "@type": "Person", name: SITE_NAME },
    ...(entry.stack ? { keywords: entry.stack.join(", ") } : {}),
  };

  return (
    <article className="py-14 pb-20">
      <JsonLd data={jsonLd} />

      <Link
        href="/articles"
        className="text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        ← All articles
      </Link>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        {entry.title}
      </h1>
      {entry.role ? (
        <p className="mt-2 text-sm text-muted-foreground">{entry.role}</p>
      ) : null}

      {entry.stack && entry.stack.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {entry.stack.map((tech) => (
            <Badge key={tech} variant="secondary">
              {tech}
            </Badge>
          ))}
        </div>
      ) : null}

      <Separator className="my-8" />

      <div className="max-w-2xl space-y-4 text-muted-foreground">
        {body.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {entry.outcomes && entry.outcomes.length > 0 ? (
        <Section title="Key points" className="py-4">
          <ul className="max-w-2xl list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {entry.outcomes.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </Section>
      ) : null}
    </article>
  );
}
