import { useEffect, useState } from "react";
import styles from "@/styles/Footer.module.css";
import { extractSocialMediaLinks, createSafeHref, handleSafeLinkClick } from "@/lib/utils/dataFetching";

export default function Footer() {
  const [contactData, setContactData] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const response = await fetch("/api/contact");
        const data = await response.json();
        setContactData(data);
      } catch (error) {
        // Log error only in development
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching contact data:", error);
        }
      }
    };

    fetchData();
  }, []);

  // Refactored: Extract Method - Social media links extraction extracted to utility
  const socialLinks = extractSocialMediaLinks(contactData);

  // Refactored: Extract Method - Safe href creation extracted to utility
  const emailHref = createSafeHref(mounted && contactData?.emailAddress, `mailto:${contactData?.emailAddress}`);
  const linkedInHref = createSafeHref(mounted, socialLinks.linkedIn);
  const githubHref = createSafeHref(mounted, socialLinks.github);
  const xHref = createSafeHref(mounted, socialLinks.X);

  return (
    <footer className={styles.footer}>
      <div className={styles.socialLinks}>
        <a
          href={emailHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => handleSafeLinkClick(e, emailHref)}
          aria-label="Email"
          suppressHydrationWarning
        >
          <img src="/images/email-logo.png" alt="Email Logo" />
        </a>
        <a
          href={linkedInHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => handleSafeLinkClick(e, linkedInHref)}
          aria-label="LinkedIn"
          suppressHydrationWarning
        >
          <img src="/images/linkedin-logo.png" alt="LinkedIn Logo" />
        </a>
        <a
          href={githubHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => handleSafeLinkClick(e, githubHref)}
          aria-label="GitHub"
          suppressHydrationWarning
        >
          <img src="/images/github-logo.png" alt="GitHub Logo" />
        </a>
        <a
          href={xHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => handleSafeLinkClick(e, xHref)}
          aria-label="X (Twitter)"
          suppressHydrationWarning
        >
          <img src="/images/x-logo.png" alt="X Logo" />
        </a>
      </div>
      <p className={styles.copyRight}>
        &copy; {new Date().getFullYear()} Josh Lowe. All rights reserved.
      </p>
    </footer>
  );
}
