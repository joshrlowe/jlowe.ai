import Head from "next/head";

export default function SEO({
  title = "Josh Lowe - Full Stack Developer",
  description = "Full stack developer specializing in modern web technologies. View my projects, skills, and experience.",
  image = "/images/og-image.png",
  url = "https://jlowe.ai",
  type = "website",
  name = "Josh Lowe",
  aboutData = null,
  contactData = null,
}) {
  const fullTitle = title.includes("Josh Lowe") ? title : `${title} | Josh Lowe`;

  // Build Person structured data for About page
  const buildPersonSchema = () => {
    if (!aboutData || type !== "profile") {
      return null;
    }

    const personSchema = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: name,
      url: url,
      jobTitle: "Full Stack Developer",
    };

    // Add email if available
    if (contactData?.emailAddress) {
      personSchema.email = contactData.emailAddress;
    }

    // Add location if available
    if (contactData?.location) {
      const location = contactData.location;
      if (location.city || location.state || location.country) {
        personSchema.address = {
          "@type": "PostalAddress",
          addressLocality: location.city || "",
          addressRegion: location.state || "",
          addressCountry: location.country || "",
        };
      }
    }

    // Add social media links
    if (contactData?.socialMediaLinks) {
      const socialLinks = contactData.socialMediaLinks;
      personSchema.sameAs = [];
      
      if (socialLinks.github) personSchema.sameAs.push(socialLinks.github);
      if (socialLinks.linkedIn) personSchema.sameAs.push(socialLinks.linkedIn);
      if (socialLinks.X) personSchema.sameAs.push(socialLinks.X);
    }

    // Add skills
    if (aboutData.technicalSkills && Array.isArray(aboutData.technicalSkills)) {
      personSchema.knowsAbout = aboutData.technicalSkills.map(
        (skill) => skill.skillName || skill
      );
    }

    // Add education
    if (aboutData.education && Array.isArray(aboutData.education)) {
      personSchema.alumniOf = aboutData.education.map((edu) => ({
        "@type": "EducationalOrganization",
        name: edu.institution,
        description: `${edu.degree} in ${edu.fieldOfStudy}`,
      }));
    }

    // Add work experience
    if (
      aboutData.professionalExperience &&
      Array.isArray(aboutData.professionalExperience)
    ) {
      personSchema.worksFor = aboutData.professionalExperience
        .filter((exp) => !exp.endDate) // Current position
        .map((exp) => ({
          "@type": "Organization",
          name: exp.company,
          jobTitle: exp.role,
        }))[0] || null;
    }

    return personSchema;
  };

  const personSchema = buildPersonSchema();

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="author" content={name} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Josh Lowe" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data */}
      {personSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personSchema),
          }}
        />
      ) : (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: name,
              url: url,
              jobTitle: "Full Stack Developer",
              worksFor: {
                "@type": "Organization",
                name: name,
              },
            }),
          }}
        />
      )}
    </Head>
  );
}
