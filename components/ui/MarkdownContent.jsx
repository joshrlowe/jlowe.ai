/**
 * MarkdownContent - Reusable markdown rendering component for frontend display
 *
 * Features:
 * - Renders markdown content as HTML using react-markdown
 * - GitHub-flavored markdown support (tables, strikethrough, etc.)
 * - Customizable styling variants
 * - Consistent prose styling across the site
 *
 * Usage:
 * - For professional summaries, descriptions, and any markdown content
 * - Shares the same underlying library as the admin MarkdownEditor
 */

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Predefined style variants for different contexts
const styleVariants = {
  default: `
    prose prose-invert max-w-none
    prose-headings:text-[var(--color-text-primary)]
    prose-p:text-[var(--color-text-secondary)]
    prose-a:text-[var(--color-primary)]
    prose-strong:text-[var(--color-text-primary)]
    prose-code:text-[var(--color-accent)]
    prose-code:bg-[var(--color-bg-card)]
    prose-code:px-1
    prose-code:py-0.5
    prose-code:rounded
    prose-pre:bg-[var(--color-bg-card)]
    prose-ul:text-[var(--color-text-secondary)]
    prose-ol:text-[var(--color-text-secondary)]
    prose-li:text-[var(--color-text-secondary)]
  `,
  compact: `
    prose prose-sm prose-invert max-w-none
    prose-headings:text-[var(--color-text-primary)]
    prose-p:text-[var(--color-text-secondary)]
    prose-p:my-2
    prose-a:text-[var(--color-primary)]
    prose-strong:text-[var(--color-text-primary)]
    prose-code:text-[var(--color-accent)]
    prose-code:bg-[var(--color-bg-card)]
    prose-code:px-1
    prose-code:py-0.5
    prose-code:rounded
    prose-pre:bg-[var(--color-bg-card)]
    prose-ul:text-[var(--color-text-secondary)]
    prose-ul:my-2
    prose-ol:text-[var(--color-text-secondary)]
    prose-ol:my-2
    prose-li:text-[var(--color-text-secondary)]
    prose-li:my-0
  `,
  inline: `
    prose prose-sm prose-invert max-w-none
    prose-p:inline
    prose-p:text-[var(--color-text-secondary)]
    prose-a:text-[var(--color-primary)]
    prose-strong:text-[var(--color-text-primary)]
  `,
};

/**
 * Renders markdown content as styled HTML
 *
 * @param {Object} props
 * @param {string} props.content - The markdown string to render
 * @param {string} props.variant - Style variant: 'default', 'compact', or 'inline'
 * @param {string} props.className - Additional CSS classes to apply
 * @param {string} props.testId - Optional data-testid for testing
 */
export default function MarkdownContent({
  content,
  variant = "default",
  className = "",
  testId,
}) {
  if (!content) return null;

  const variantStyles = styleVariants[variant] || styleVariants.default;

  return (
    <div
      className={`${variantStyles} ${className}`.trim()}
      data-testid={testId}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

