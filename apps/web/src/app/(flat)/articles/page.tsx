import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ARTICLES } from "@/data/articles";

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
