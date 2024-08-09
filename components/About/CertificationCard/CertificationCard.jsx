import Link from "next/link";

import styles from "./CertificationCard.module.css";

export default function CertificationCard({
  name,
  credentialUrl,
  organization,
  organizationUrl,
  issueDate,
}) {
  return (
    <Link
      href={credentialUrl}
      target="_blank"
      className={styles.certificationCard}
    >
      <h3>{name}</h3>
      <p className={styles.organization}>{organization}</p>
      <p className={styles.issueDate}>
        {new Date(issueDate).toLocaleDateString("en-US", { timeZone: "UTC" })}
      </p>
    </Link>
  );
}
