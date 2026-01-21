/**
 * Admin Shared Components
 *
 * Refactoring: Extract Class / Extract Component
 * Consolidates repeated UI patterns from admin components into reusable parts.
 */

// Re-export all shared components
export { default as FormField } from "./FormField";
export { default as TagInput } from "./TagInput";
export { default as LoadingSpinner } from "./LoadingSpinner";
export { default as Modal } from "./Modal";
export { default as MediaUpload } from "./MediaUpload";
export { adminStyles } from "./styles";
export { PROJECT_STATUSES, ICON_OPTIONS, VARIANT_OPTIONS } from "./constants";
