import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import styles from "@/styles/SocialLinks.module.css";

export default function SocialLinks({ contactData, vertical = false }) {
  const [socialLinks, setSocialLinks] = useState({});
  const containerRef = useRef(null);

  useEffect(() => {
    if (!contactData) return;

    const links = contactData.socialMediaLinks && typeof contactData.socialMediaLinks === "object"
      ? contactData.socialMediaLinks
      : {};

    setSocialLinks(links);
  }, [contactData]);

  useEffect(() => {
    if (!containerRef.current) return;

    const links = containerRef.current.querySelectorAll(`.${styles.socialLink}`);
    
    links.forEach((link, index) => {
      gsap.fromTo(
        link,
        { opacity: 0, scale: 0.8, y: vertical ? 20 : 0, x: vertical ? 0 : 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          x: 0,
          duration: 0.5,
          delay: index * 0.1,
          ease: "back.out(1.7)",
        }
      );
    });
  }, [socialLinks, vertical]);

  if (!contactData || Object.keys(socialLinks).length === 0) {
    return null;
  }

  const containerClass = vertical ? styles.socialLinksVertical : styles.socialLinks;

  return (
    <div ref={containerRef} className={containerClass} role="list" aria-label="Social media links">
      {socialLinks.github && (
        <Link
          href={socialLinks.github}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialLink}
          aria-label="Visit GitHub profile"
          role="listitem"
        >
          <Image
            src="/images/github-logo.png"
            alt="GitHub"
            width={24}
            height={24}
            unoptimized
          />
        </Link>
      )}
      {socialLinks.linkedIn && (
        <Link
          href={socialLinks.linkedIn}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialLink}
          aria-label="Visit LinkedIn profile"
          role="listitem"
        >
          <Image
            src="/images/linkedin-logo.png"
            alt="LinkedIn"
            width={24}
            height={24}
            unoptimized
          />
        </Link>
      )}
      {socialLinks.X && (
        <Link
          href={socialLinks.X}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialLink}
          aria-label="Visit X (Twitter) profile"
          role="listitem"
        >
          <Image
            src="/images/x-logo.png"
            alt="X (Twitter)"
            width={24}
            height={24}
            unoptimized
          />
        </Link>
      )}
      {contactData.emailAddress && (
        <Link
          href={`mailto:${contactData.emailAddress}`}
          className={styles.socialLink}
          aria-label="Send email"
          role="listitem"
        >
          <Image
            src="/images/email-logo.png"
            alt="Email"
            width={24}
            height={24}
            unoptimized
          />
        </Link>
      )}
    </div>
  );
}

