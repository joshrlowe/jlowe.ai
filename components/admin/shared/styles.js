/**
 * Admin Shared Styles
 *
 * Refactoring: Encapsulate Variable
 * Consolidated CSS class strings used across admin components.
 */

export const adminStyles = {
  // Form inputs
  input:
    "w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]",
  inputSmall:
    "w-full px-4 py-2 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]",

  // Labels
  label: "block text-sm font-medium text-[var(--color-text-primary)] mb-2",
  labelSmall: "block text-sm font-medium text-[var(--color-text-primary)] mb-1",

  // Cards
  card: "p-4 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)]",
  cardHover:
    "p-4 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors",

  // Buttons
  buttonPrimary:
    "px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
  buttonSecondary:
    "px-6 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] transition-colors",
  buttonOutline:
    "px-4 py-2 rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors",
  buttonDanger:
    "px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors",
  buttonDangerOutline:
    "px-3 py-1 text-sm rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors",

  // Tags/Badges
  tag: "px-2 py-1 text-sm rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center gap-1",

  // Layout
  flexCenter: "flex items-center justify-center",
  spacingY4: "space-y-4",
  spacingY6: "space-y-6",

  // Tab navigation
  tabActive:
    "px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] text-white",
  tabInactive:
    "px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-bg-darker)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors",
};
