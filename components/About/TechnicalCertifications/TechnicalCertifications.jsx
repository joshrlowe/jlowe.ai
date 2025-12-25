import { useInView } from "react-intersection-observer";
import CertificationCard from "../CertificationCard/CertificationCard";
import styles from "./TechnicalCertifications.module.css";

export default function TechnicalCertifications({ certifications }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // Sort certifications by issue date (most recent first)
  const sortedCertifications = [...certifications].sort((a, b) => {
    const dateA = new Date(a.issueDate || 0);
    const dateB = new Date(b.issueDate || 0);
    return dateB - dateA;
  });

  const isExpired = (certification) => {
    if (!certification.expirationDate) return false;
    const expiration = new Date(certification.expirationDate);
    return expiration < new Date();
  };

  const isExpiringSoon = (certification) => {
    if (!certification.expirationDate) return false;
    const expiration = new Date(certification.expirationDate);
    const daysUntilExpiration = Math.ceil(
      (expiration - new Date()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiration > 0 && daysUntilExpiration <= 90;
  };

  return (
    <>
      <hr />
      <section
        ref={ref}
        className={`${styles.technicalCertifications} ${inView ? styles.fadeIn : ""}`}
      >
        <h2>Technical Certifications</h2>
        <div className={styles.certificationGrid}>
          {sortedCertifications.map((certification, index) => {
            const expired = isExpired(certification);
            const expiringSoon = isExpiringSoon(certification);

            return (
              <div key={index} className={styles.certificationWrapper}>
                <CertificationCard
                  name={certification.name}
                  credentialUrl={certification.credentialUrl}
                  organization={certification.organization}
                  organizationUrl={certification.organizationUrl}
                  issueDate={certification.issueDate}
                  expirationDate={certification.expirationDate}
                  expired={expired}
                  expiringSoon={expiringSoon}
                />
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
