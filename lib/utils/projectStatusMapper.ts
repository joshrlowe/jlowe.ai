/**
 * Maps MongoDB project status values to Prisma enum values.
 * This utility centralizes the status mapping logic to avoid duplication.
 */
import type { ProjectStatus } from "@prisma/client";

const statusMap: Record<string, ProjectStatus> = {
  // Legacy status strings (with spaces)
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
  // Prisma enum values (direct pass-through)
  Draft: "Draft",
  Published: "Published",
  InProgress: "InProgress",
  InDevelopment: "InDevelopment",
  InTesting: "InTesting",
  InProduction: "InProduction",
  OnHold: "OnHold",
};

export function mapProjectStatus(
  mongoStatus: string | null | undefined,
): ProjectStatus | null {
  if (!mongoStatus) return null;
  return statusMap[mongoStatus] || null;
}
