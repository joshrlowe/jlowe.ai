import Head from "next/head";

export default function SEO({
  title = "Josh Lowe",
  description = "Full Stack Developer specializing in modern web technologies.",
  image = "/images/logo.png",
  url = "https://jlowe.ai",
  type = "website",
}) {
  const fullTitle = title.includes("Josh Lowe")
    ? title
    : `${title} | Josh Lowe`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Josh Lowe" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />
    </Head>
  );
}
