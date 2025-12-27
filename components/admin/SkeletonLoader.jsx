export function TableRowSkeleton({ colCount = 6 }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-4 bg-[var(--color-bg-darker)] rounded"></div>
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] animate-pulse">
      <div className="h-4 w-3/4 bg-[var(--color-bg-darker)] rounded mb-2"></div>
      <div className="h-4 w-1/2 bg-[var(--color-bg-darker)] rounded"></div>
    </div>
  );
}

export default function SkeletonLoader({ type = "card", count = 3 }) {
  if (type === "table") {
    return Array.from({ length: count }).map((_, i) => (
      <TableRowSkeleton key={i} />
    ));
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
