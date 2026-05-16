import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const styleVariants = {
  default: `
    prose prose-invert max-w-none
    prose-headings:text-[var(--color-text-primary)]
    prose-p:text-[var(--color-text-secondary)]
    prose-a:text-[var(--color-primary)]
    prose-a:underline
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
    prose-a:underline
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
    prose-a:underline
    prose-strong:text-[var(--color-text-primary)]
  `,
} as const;

export type MarkdownVariant = keyof typeof styleVariants;

export interface MarkdownContentProps {
  content?: string | null;
  variant?: MarkdownVariant;
  className?: string;
  testId?: string;
}

export default function MarkdownContent({
  content,
  variant = "default",
  className = "",
  testId,
}: MarkdownContentProps) {
  if (!content) return null;

  const variantStyles = styleVariants[variant] || styleVariants.default;

  return (
    <div className={`${variantStyles} ${className}`.trim()} data-testid={testId}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
