/**
 * StatusBadge.jsx
 *
 * Project status indicator with space-themed colors.
 */

const statusConfig = {
  Published: {
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.3)",
    text: "#10b981",
    label: "Live",
  },
  InProgress: {
    bg: "rgba(0, 212, 255, 0.1)",
    border: "rgba(0, 212, 255, 0.3)",
    text: "#00d4ff",
    label: "In Progress",
  },
  InDevelopment: {
    bg: "rgba(139, 92, 246, 0.1)",
    border: "rgba(139, 92, 246, 0.3)",
    text: "#8b5cf6",
    label: "In Development",
  },
  Completed: {
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.3)",
    text: "#10b981",
    label: "Completed",
  },
  Maintenance: {
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.3)",
    text: "#f59e0b",
    label: "Maintenance",
  },
  OnHold: {
    bg: "rgba(100, 116, 139, 0.1)",
    border: "rgba(100, 116, 139, 0.3)",
    text: "#64748b",
    label: "On Hold",
  },
  Deprecated: {
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.3)",
    text: "#ef4444",
    label: "Deprecated",
  },
  Draft: {
    bg: "rgba(100, 116, 139, 0.1)",
    border: "rgba(100, 116, 139, 0.3)",
    text: "#64748b",
    label: "Draft",
  },
};

export default function StatusBadge({ status, size = "sm" }) {
  const config = statusConfig[status] || statusConfig.Draft;

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeClasses[size]}`}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: config.text }}
      />
      {config.label}
    </span>
  );
}
