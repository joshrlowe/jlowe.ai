export default function ProjectSkeleton() {
  return (
    <div className="bg-[var(--color-bg-card)] rounded-xl overflow-hidden border border-[var(--color-border)] animate-pulse">
      <div className="h-48 bg-[var(--color-bg-darker)]"></div>
      <div className="p-6">
        <div className="h-6 w-3/4 bg-[var(--color-bg-darker)] rounded mb-3"></div>
        <div className="h-4 w-full bg-[var(--color-bg-darker)] rounded mb-2"></div>
        <div className="h-4 w-2/3 bg-[var(--color-bg-darker)] rounded mb-4"></div>
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-[var(--color-bg-darker)] rounded-full"></div>
          <div className="h-6 w-20 bg-[var(--color-bg-darker)] rounded-full"></div>
          <div className="h-6 w-14 bg-[var(--color-bg-darker)] rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
