import type { Metadata, Route } from "next";
import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { entriesByKind, summarize } from "@/lib/corpus";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Articles, tutorials, and insights on AI engineering and web technology.",
};

export default function ArticlesPage() {
  // Corpus is the single source of truth. Its `kind: article` entries drive the
  // list, each linking to its detail route at /articles/[slug] (which mirrors
  // the projects/[slug] route from PR #121). When every article is hidden
  // (`visibility: private`) the corpus has zero public articles — the same state
  // #121 shipped in, before any article was authored — so the page renders a
  // "coming soon" placeholder and lists nothing (no hidden draft leaks into the
  // index). Un-hiding an article (flip its frontmatter back to
  // `visibility: public`, run `pnpm corpus`) brings the real list back on its own.
  const corpusArticles = entriesByKind("article");

  if (corpusArticles.length === 0) {
    return (
      <div className="py-14 pb-20">
        <h1 className="text-3xl font-semibold tracking-tight">Articles</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Writing on AI engineering and web technology is coming soon. Check
          back shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="py-14 pb-20">
      <h1 className="text-3xl font-semibold tracking-tight">Articles</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Articles, tutorials, and insights on AI engineering and web technology.
      </p>

      <div className="mt-8 space-y-4">
        {corpusArticles.map((article) => (
          <Card key={article.slug}>
            <CardHeader>
              <CardTitle className="text-base">
                <Link
                  href={`/articles/${article.slug}/` as Route}
                  className="transition-colors hover:text-primary focus-visible:text-primary"
                >
                  {article.title}
                </Link>
              </CardTitle>
              <CardDescription>{summarize(article)}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
