import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ARTICLES } from "@/data/articles";
import { entriesByKind, summarize } from "@/lib/corpus";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Articles, tutorials, and insights on AI engineering and web technology.",
};

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function ArticlesPage() {
  // Corpus is the single source of truth. When it grows `kind: article` entries,
  // list them here. Until the owner authors any, fall back to the placeholder
  // previews so the page is never empty.
  //
  // NOTE (plumbing gap): a live /articles/[slug] detail route can't ship yet —
  // `output: "export"` rejects a dynamic route whose generateStaticParams is
  // empty, and the corpus has zero articles. Once the first article lands,
  // copy apps/web/src/app/(flat)/projects/[slug]/page.tsx (swap kind → "article"
  // and CreativeWork → BlogPosting) and link these cards to it.
  const corpusArticles = entriesByKind("article");

  if (corpusArticles.length > 0) {
    return (
      <div className="py-14 pb-20">
        <h1 className="text-3xl font-semibold tracking-tight">Articles</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Articles, tutorials, and insights on AI engineering and web
          technology.
        </p>

        <div className="mt-8 space-y-4">
          {corpusArticles.map((article) => (
            <Card key={article.slug}>
              <CardHeader>
                <CardTitle className="text-base">{article.title}</CardTitle>
                <CardDescription>{summarize(article)}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-14 pb-20">
      <h1 className="text-3xl font-semibold tracking-tight">Articles</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Latest articles, tutorials, and insights on AI engineering and web
        technology. Full posts return with a later phase — these are previews.
      </p>

      <div className="mt-8 space-y-4">
        {ARTICLES.map((article) => (
          <Card key={article.slug}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{article.topic}</Badge>
                <time dateTime={article.publishedAt}>
                  {formatDate(article.publishedAt)}
                </time>
                <span aria-hidden>·</span>
                <span>{article.readingMinutes} min read</span>
              </div>
              <CardTitle className="text-base">{article.title}</CardTitle>
              <CardDescription>{article.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
