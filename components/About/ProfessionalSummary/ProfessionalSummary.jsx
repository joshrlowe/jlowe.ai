export default function ProfessionalSummary({ children }) {
  if (!children) return null;

  return (
    <div className="p-8 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 font-heading">
        Professional Summary
      </h2>
      <div
        className="text-[var(--color-text-secondary)] leading-relaxed prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: children }}
      />
    </div>
  );
}
