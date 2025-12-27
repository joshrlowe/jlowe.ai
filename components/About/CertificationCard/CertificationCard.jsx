export default function CertificationCard({ certification }) {
  if (!certification) return null;

  return (
    <div className="p-4 rounded-lg bg-[var(--color-bg-darker)] hover:border-[var(--color-primary)] transition-all duration-300 border border-transparent">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-[var(--color-primary)]">
            {(certification.name || certification.title || "C").charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] truncate">
            {certification.name || certification.title}
          </h3>
          <div className="text-sm text-[var(--color-primary)]">
            {certification.issuer || certification.organization}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">
            {certification.dateObtained || certification.date}
            {certification.expirationDate &&
              ` - ${certification.expirationDate}`}
          </div>
          {certification.credentialId && (
            <div className="text-xs text-[var(--color-text-muted)] mt-1">
              ID: {certification.credentialId}
            </div>
          )}
        </div>
      </div>
      {certification.url && (
        <a
          href={certification.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
        >
          View Credential →
        </a>
      )}
    </div>
  );
}
