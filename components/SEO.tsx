import Head from "next/head";
import { useRouter } from "next/router";
import { SITE_URL } from "@/lib/seo/schema";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  /** Ask crawlers to skip the page (404/500, previews). Also drops the canonical. */
  noindex?: boolean;
}

/** Default social card in public/ — a real 1200×630 asset with known dimensions. */
const DEFAULT_OG_IMAGE = "/og-default.png";

/** Social scrapers require absolute og:image URLs; prefix site-relative paths. */
const toAbsoluteUrl = (pathOrUrl: string): string =>
  pathOrUrl.startsWith("/") ? `${SITE_URL}${pathOrUrl}` : pathOrUrl;

export default function SEO({
  title = "Josh Lowe",
  description = "Full Stack Developer specializing in modern web technologies.",
  image = DEFAULT_OG_IMAGE,
  url,
  type = "website",
  noindex = false,
}: SEOProps) {
  const router = useRouter();
  const fullTitle = title.includes("Josh Lowe") ? title : `${title} | Josh Lowe`;

  // Canonical defaults to the current route (query string and hash stripped) so
  // pages that omit `url` don't all canonicalize to the homepage. An explicit
  // `url` prop always wins.
  const path = (router?.asPath ?? "/").split(/[?#]/)[0];
  const canonicalUrl = url ?? (path === "/" ? SITE_URL : `${SITE_URL}${path}`);

  const imageUrl = toAbsoluteUrl(image);
  // Width/height are only known for the bundled default card; arbitrary page
  // images skip them rather than claim dimensions we haven't measured.
  const isDefaultImage = image === DEFAULT_OG_IMAGE;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      {isDefaultImage && <meta property="og:image:width" content="1200" />}
      {isDefaultImage && <meta property="og:image:height" content="630" />}
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Josh Lowe" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Additional SEO — noindex pages render at arbitrary URLs (404/500),
          so a canonical would be meaningless there. */}
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />
      {!noindex && <link rel="canonical" href={canonicalUrl} />}
    </Head>
  );
}
