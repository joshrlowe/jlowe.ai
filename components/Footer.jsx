import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import Link from "next/link";

import styles from "@/styles/Footer.module.css";

export default function Footer() {
  const [contactData, setContactData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/contact");
        const data = await response.json();
        setContactData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  if (!contactData) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.socialLinks}>
        <Link href={`mailto:${contactData.emailAddress}`} target="_blank">
          <img src="/images/email-logo.png" alt="Email Logo" />
        </Link>
        <Link href={contactData.socialMediaLinks.linkedIn} target="_blank">
          <img src="/images/linkedin-logo.png" alt="LinkedIn Logo" />
        </Link>
        <Link href={contactData.socialMediaLinks.github} target="_blank">
          <img src="/images/github-logo.png" alt="GitHub Logo" />
        </Link>
        <Link href={contactData.socialMediaLinks.X} target="_blank">
          <div></div>
          <img src="/images/x-logo.png" alt="X Logo" />
        </Link>
      </div>
      <p className={styles.copyRight}>
        &copy; {new Date().getFullYear()} Josh Lowe. All rights reserved.
      </p>
    </footer>
  );
}
