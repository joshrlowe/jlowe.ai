/**
 * MarkdownEditor - Rich markdown editor with live preview
 *
 * Features:
 * - Tab-based Edit/Preview toggle
 * - Full markdown rendering with react-markdown
 * - GitHub-flavored markdown support
 * - Syntax highlighting for code blocks
 * - Customizable label and placeholder
 */

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { adminStyles } from "./shared/styles";

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "Enter markdown content...",
  label = "Content (Markdown)",
  rows = 8,
  className = "",
}) {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <label className={adminStyles.label}>{label}</label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className={`px-3 py-1 text-sm rounded-l-lg transition-colors ${
              !isPreview
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-bg-darker)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            className={`px-3 py-1 text-sm rounded-r-lg transition-colors ${
              isPreview
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-bg-darker)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {isPreview ? (
        <div
          className="min-h-[200px] p-4 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] overflow-auto"
          data-testid="markdown-preview"
        >
          {value ? (
            <div className="prose prose-invert max-w-none prose-headings:text-[var(--color-text-primary)] prose-p:text-[var(--color-text-secondary)] prose-a:text-[var(--color-primary)] prose-strong:text-[var(--color-text-primary)] prose-code:text-[var(--color-accent)] prose-code:bg-[var(--color-bg-card)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[var(--color-bg-card)] prose-ul:text-[var(--color-text-secondary)] prose-ol:text-[var(--color-text-secondary)] prose-li:text-[var(--color-text-secondary)]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-[var(--color-text-muted)] italic">
              Nothing to preview. Start typing in the editor.
            </p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`${adminStyles.input} resize-y font-mono text-sm`}
          data-testid="markdown-editor"
        />
      )}

    </div>
  );
}
