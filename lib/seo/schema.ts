/**
 * Reusable schema.org payload builders.
 *
 * Keeps the JsonLd <script> contents in one place so per-page wiring
 * stays declarative and the Person / WebSite definitions don't drift
 * between routes.
 */
import type {
  BlogPosting,
  BreadcrumbList,
  CollectionPage,
  CreativeWork,
  ListItem,
  Person,
  WebSite,
  WithContext,
} from "schema-dts";

export const SITE_URL = "https://jlowe.ai";

/**
 * Prefix site-relative paths with SITE_URL; absolute URLs pass through.
 * "/" maps to the bare SITE_URL so home links match the homepage canonical.
 */
const toAbsoluteUrl = (pathOrUrl: string): string => {
  if (pathOrUrl === "/") return SITE_URL;
  return pathOrUrl.startsWith("/") ? `${SITE_URL}${pathOrUrl}` : pathOrUrl;
};

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

interface BreadcrumbItem {
  name: string;
  /** Site-relative path ("/projects") or absolute URL. Must resolve — Google
   * requires `item` on every crumb except (optionally) the last one. */
  path: string;
}

/**
 * BreadcrumbList schema for detail pages (Home › … › current page).
 * Items are emitted in the order given; positions are 1-based. Crumb URLs use
 * the `item: { "@id": … }` form — the variant schema-dts can type (`item`
 * expects Thing | IdReference, not a bare URL string).
 */
export function breadcrumbSchema(items: BreadcrumbItem[]): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(
      (item, index): ListItem => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: { "@id": toAbsoluteUrl(item.path) },
      })
    ),
  };
}

/** Cap ItemList entries so listing pages don't ship unbounded JSON-LD. */
const COLLECTION_ITEM_LIMIT = 20;

interface CollectionPageArgs {
  title: string;
  description: string;
  /** Site-relative path of the listing page, e.g. "/projects". */
  path: string;
  items: { name: string; path: string }[];
}

/**
 * CollectionPage + ItemList schema for listing pages (/projects, /articles).
 * Entries beyond COLLECTION_ITEM_LIMIT are dropped and numberOfItems reflects
 * the emitted list, so the payload never claims more than it shows.
 */
export function collectionPageSchema(args: CollectionPageArgs): WithContext<CollectionPage> {
  const capped = args.items.slice(0, COLLECTION_ITEM_LIMIT);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: args.title,
    description: args.description,
    url: toAbsoluteUrl(args.path),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: capped.length,
      itemListElement: capped.map(
        (item, index): ListItem => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          url: toAbsoluteUrl(item.path),
        })
      ),
    },
  };
}
