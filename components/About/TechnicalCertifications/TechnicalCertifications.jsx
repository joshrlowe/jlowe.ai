import CertificationCard from "../CertificationCard/CertificationCard";

export default function TechnicalCertifications({ certifications = [] }) {
  if (!certifications || certifications.length === 0) return null;

  return (
    <div className="p-8 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 font-heading">
        Technical Certifications
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {certifications.map((cert, index) => (
          <CertificationCard key={index} certification={cert} />
        ))}
      </div>
    </div>
  );
}
