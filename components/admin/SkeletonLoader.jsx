export default function SkeletonLoader({ width = "100%", height = "20px", className = "" }) {
  return (
    <div
      className={`skeleton-loader ${className}`}
      style={{
        width,
        height,
        backgroundColor: "var(--color-bg-dark-alt)",
        borderRadius: "var(--radius-md)",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

export function TableRowSkeleton({ colCount = 4 }) {
  return (
    <tr>
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i}>
          <SkeletonLoader height="20px" />
        </td>
      ))}
    </tr>
  );
}

export function FormFieldSkeleton() {
  return (
    <div className="mb-3">
      <SkeletonLoader width="30%" height="16px" className="mb-2" />
      <SkeletonLoader width="100%" height="40px" />
    </div>
  );
}

