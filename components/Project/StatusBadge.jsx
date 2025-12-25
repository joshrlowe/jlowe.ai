import styles from "@/styles/StatusBadge.module.css";

export default function StatusBadge({ status }) {
  if (!status) return null;

  const statusConfig = {
    Published: { label: "Published", className: styles.published },
    InProduction: { label: "In Production", className: styles.inProduction },
    InProgress: { label: "In Progress", className: styles.inProgress },
    Completed: { label: "Completed", className: styles.completed },
    InDevelopment: { label: "In Development", className: styles.inDevelopment },
    InTesting: { label: "In Testing", className: styles.inTesting },
    Maintenance: { label: "Maintenance", className: styles.maintenance },
    OnHold: { label: "On Hold", className: styles.onHold },
    Deprecated: { label: "Deprecated", className: styles.deprecated },
    Sunsetted: { label: "Sunsetted", className: styles.sunsetted },
    Draft: { label: "Draft", className: styles.draft },
    Planned: { label: "Planned", className: styles.planned },
  };

  const config = statusConfig[status] || { label: status, className: styles.default };

  return (
    <span className={`${styles.statusBadge} ${config.className}`} aria-label={`Status: ${config.label}`}>
      {config.label}
    </span>
  );
}

