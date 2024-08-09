import { useInView } from "react-intersection-observer";

import CertificationCard from "../CertificationCard/CertificationCard";

import styles from "./TechnicalCertifications.module.css";

export default function TechnicalCertifications({ certifications }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  certifications.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <hr />
      <section
        ref={ref}
        className={`${styles.technicalCertifications} ${inView ? styles.fadeIn : ""}`}
      >
        <h2>Technical Certifications</h2>
        <div className={styles.certificationGrid}>
          {certifications.map((certification, index) => (
            <CertificationCard
              key={index}
              name={certification.name}
              credentialUrl={certification.credentialUrl}
              organization={certification.organization}
              organizationUrl={certification.organizationUrl}
              issueDate={certification.issueDate}
            />
          ))}
        </div>
      </section>
    </>
  );
}
