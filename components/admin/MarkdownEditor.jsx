import { useState } from "react";

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "Enter markdown content...",
}) {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-[var(--color-text-primary)]">
          Description (Markdown)
        </label>
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
        >
          {isPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {isPreview ? (
        <div
          className="min-h-[200px] p-4 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-secondary)] prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: value.replace(/\n/g, "<br>") }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={8}
          className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-y font-mono text-sm"
        />
      )}
    </div>
  );
}
