export default function AboutHero({
  name,
  briefBio,
  contactData,
  professionalSummary,
}) {
  const socialLinks = contactData?.socialMediaLinks || {};

  return (
    <div className="text-center py-12">
      <h1
        className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 font-heading"
        style={{ color: "var(--color-primary)" }}
      >
        {name || "About Me"}
      </h1>
      {briefBio && (
        <p
          className="text-lg sm:text-xl mx-auto mb-8 leading-relaxed"
          style={{ color: "var(--color-text-secondary)", maxWidth: "80%" }}
        >
          {briefBio}
        </p>
      )}

      {/* Social Links */}
      <div className="flex justify-center gap-4">
        {socialLinks.linkedIn && (
          <a
            href={socialLinks.linkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 hover:-translate-y-1"
            style={{
              background: "rgba(232, 93, 4, 0.08)",
              border: "1px solid rgba(232, 93, 4, 0.15)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-primary)";
              e.currentTarget.style.borderColor = "var(--color-primary)";
              e.currentTarget.style.boxShadow =
                "0 0 25px rgba(232, 93, 4, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(232, 93, 4, 0.08)";
              e.currentTarget.style.borderColor = "rgba(232, 93, 4, 0.15)";
              e.currentTarget.style.boxShadow = "none";
            }}
            aria-label="LinkedIn"
          >
            <img
              src="/images/linkedin-logo.png"
              alt="LinkedIn"
              className="w-5 h-5 object-contain filter brightness-0 invert opacity-80"
            />
          </a>
        )}
        {socialLinks.github && (
          <a
            href={socialLinks.github}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 hover:-translate-y-1"
            style={{
              background: "rgba(232, 93, 4, 0.08)",
              border: "1px solid rgba(232, 93, 4, 0.15)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-primary)";
              e.currentTarget.style.borderColor = "var(--color-primary)";
              e.currentTarget.style.boxShadow =
                "0 0 25px rgba(232, 93, 4, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(232, 93, 4, 0.08)";
              e.currentTarget.style.borderColor = "rgba(232, 93, 4, 0.15)";
              e.currentTarget.style.boxShadow = "none";
            }}
            aria-label="GitHub"
          >
            <img
              src="/images/github-logo.png"
              alt="GitHub"
              className="w-5 h-5 object-contain filter brightness-0 invert opacity-80"
            />
          </a>
        )}
        {contactData?.emailAddress && (
          <a
            href={`mailto:${contactData.emailAddress}`}
            className="w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 hover:-translate-y-1"
            style={{
              background: "rgba(232, 93, 4, 0.08)",
              border: "1px solid rgba(232, 93, 4, 0.15)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-primary)";
              e.currentTarget.style.borderColor = "var(--color-primary)";
              e.currentTarget.style.boxShadow =
                "0 0 25px rgba(232, 93, 4, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(232, 93, 4, 0.08)";
              e.currentTarget.style.borderColor = "rgba(232, 93, 4, 0.15)";
              e.currentTarget.style.boxShadow = "none";
            }}
            aria-label="Email"
          >
            <img
              src="/images/email-logo.png"
              alt="Email"
              className="w-5 h-5 object-contain filter brightness-0 invert opacity-80"
            />
          </a>
        )}
      </div>
    </div>
  );
}
