/**
 * LoadingSpinner - Reusable loading indicator
 *
 * Refactoring: Extract Component
 * Previously duplicated in 5+ admin components.
 */

export default function LoadingSpinner({ size = "md", className = "" }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-4",
  };

  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-[var(--color-primary)] border-t-transparent rounded-full animate-spin`}
      />
    </div>
  );
}
