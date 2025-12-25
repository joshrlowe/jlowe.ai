/**
 * Maps MongoDB project status values to Prisma enum values.
 * This utility centralizes the status mapping logic to avoid duplication.
 */
export function mapProjectStatus(mongoStatus) {
  if (!mongoStatus) return null;

  const statusMap = {
    Planned: "Planned",
    "In Progress": "InProgress",
    "In Development": "InDevelopment",
    "In Testing": "InTesting",
    Completed: "Completed",
    "In Production": "InProduction",
    Maintenance: "Maintenance",
    "On Hold": "OnHold",
    Deprecated: "Deprecated",
    Sunsetted: "Sunsetted",
  };

  return statusMap[mongoStatus] || null;
}
