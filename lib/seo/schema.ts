/**
 * Reusable schema.org payload builders.
 *
 * Keeps the JsonLd <script> contents in one place so per-page wiring
 * stays declarative and the Person / WebSite definitions don't drift
 * between routes.
 */
import type { BlogPosting, CreativeWork, Person, WebSite, WithContext } from "schema-dts";

export const SITE_URL = "https://jlowe.ai";

/**
 * Sitewide Person schema. Reflects current bio: MS CS at UCF + tech lead
 * at BidOps. Update when role / credentials change.
 */
export const personSchema: WithContext<Person> = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Josh Lowe",
  url: SITE_URL,
  jobTitle: "Tech Lead",
  worksFor: {
    "@type": "Organization",
    name: "BidOps AI",
  },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "University of Central Florida",
  },
  sameAs: [
    "https://github.com/joshrlowe",
    "https://www.linkedin.com/in/joshrlowe",
  ],
};

/**
 * Sitewide WebSite schema. SearchAction is omitted intentionally —
 * we don't expose a structured search query string.
 */
export const websiteSchema: WithContext<WebSite> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "jlowe.ai",
  url: SITE_URL,
  description: "Personal site and AI consultancy of Josh Lowe.",
  publisher: {
    "@type": "Person",
    name: "Josh Lowe",
    url: SITE_URL,
  },
};

interface BlogPostingArgs {
  title: string;
  description: string;
  slug: string;
  topic: string;
  author?: string;
  datePublished?: string | Date;
  dateModified?: string | Date;
  image?: string;
}

/**
 * BlogPosting schema for /articles/[topic]/[slug] pages.
 *
 * datePublished and dateModified accept Date or ISO string. mainEntityOfPage
 * is set to the article URL so Google can resolve the canonical mapping.
 */
export function blogPostingSchema(args: BlogPostingArgs): WithContext<BlogPosting> {
  const url = `${SITE_URL}/articles/${args.topic}/${args.slug}`;
  const toIso = (d: string | Date | undefined): string | undefined =>
    d instanceof Date ? d.toISOString() : d;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: args.title,
    description: args.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: {
      "@type": "Person",
      name: args.author ?? "Josh Lowe",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Person",
      name: "Josh Lowe",
      url: SITE_URL,
    },
    datePublished: toIso(args.datePublished),
    dateModified: toIso(args.dateModified) ?? toIso(args.datePublished),
    image: args.image,
    inLanguage: "en",
  };
}

interface CreativeWorkArgs {
  title: string;
  description: string;
  slug: string;
  image?: string;
  dateCreated?: string | Date;
  url?: string;
}

/**
 * CreativeWork schema for /projects/[slug] pages.
 * Suitable for software / research / writing-style projects; choose a more
 * specific subtype (SoftwareSourceCode, etc.) at the call site if needed.
 */
export function projectSchema(args: CreativeWorkArgs): WithContext<CreativeWork> {
  const url = args.url ?? `${SITE_URL}/projects/${args.slug}`;
  const toIso = (d: string | Date | undefined): string | undefined =>
    d instanceof Date ? d.toISOString() : d;
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: args.title,
    description: args.description,
    url,
    image: args.image,
    dateCreated: toIso(args.dateCreated),
    author: {
      "@type": "Person",
      name: "Josh Lowe",
      url: SITE_URL,
    },
  };
}
