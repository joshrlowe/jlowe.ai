import Link from "next/link";
import styles from "./CertificationCard.module.css";

export default function CertificationCard({
  name,
  credentialUrl,
  organization,
  organizationUrl,
  issueDate,
  expirationDate,
  expired = false,
  expiringSoon = false,
}) {
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  const getStatusBadge = () => {
    if (expired) {
      return <span className={styles.badgeExpired}>Expired</span>;
    }
    if (expiringSoon) {
      return <span className={styles.badgeExpiring}>Expiring Soon</span>;
    }
    if (expirationDate) {
      return <span className={styles.badgeValid}>Valid</span>;
    }
    return null;
  };

  return (
    <Link
      href={credentialUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.certificationCard} ${expired ? styles.expired : ""}`}
    >
      <div className={styles.cardHeader}>
        <div className={styles.badgeContainer}>{getStatusBadge()}</div>
      </div>

      <h3 className={styles.certName}>{name}</h3>

      {organizationUrl ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            window.open(organizationUrl, "_blank", "noopener,noreferrer");
          }}
          className={styles.organization}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            font: "inherit",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {organization}
        </button>
      ) : (
        <p className={styles.organization}>{organization}</p>
      )}

      <div className={styles.cardDates}>
        <div className={styles.dateRow}>
          <span className={styles.dateLabel}>Issued:</span>
          <span className={styles.dateValue}>{formatDate(issueDate) || "N/A"}</span>
        </div>
        {expirationDate && (
          <div className={styles.dateRow}>
            <span className={styles.dateLabel}>Expires:</span>
            <span
              className={`${styles.dateValue} ${
                expired || expiringSoon ? styles.dateWarning : ""
              }`}
            >
              {formatDate(expirationDate)}
            </span>
          </div>
        )}
      </div>

      {credentialUrl && (
        <div className={styles.viewCredential}>
          <span className={styles.viewCredentialText}>View Credential</span>
          <span className={styles.viewCredentialIcon}>→</span>
        </div>
      )}
    </Link>
  );
}
