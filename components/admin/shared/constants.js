/**
 * Admin Constants
 *
 * Refactoring: Replace Magic Numbers with Named Constants
 * Extracted from HomeSettingsSection and ProjectsSettingsSection.
 */

export const PROJECT_STATUSES = [
  { value: "Draft", label: "Draft" },
  { value: "Published", label: "Published" },
  { value: "InProgress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
];

export const ICON_OPTIONS = [
  { key: "computer", label: "Computer/Monitor" },
  { key: "database", label: "Database" },
  { key: "code", label: "Code/Terminal" },
  { key: "cloud", label: "Cloud" },
  { key: "chart", label: "Chart/Analytics" },
  { key: "book", label: "Book/Training" },
  { key: "brain", label: "Brain/AI" },
  { key: "rocket", label: "Rocket" },
  { key: "cog", label: "Settings/Cog" },
  { key: "shield", label: "Security/Shield" },
];

export const VARIANT_OPTIONS = [
  { key: "primary", label: "Primary (Orange)", color: "#E85D04" },
  { key: "secondary", label: "Secondary (Red)", color: "#9D0208" },
  { key: "accent", label: "Accent (Gold)", color: "#FAA307" },
  { key: "cool", label: "Cool (Blue)", color: "#4CC9F0" },
];
