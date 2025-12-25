import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "react-bootstrap";

export default function MarkdownEditor({ value, onChange, placeholder = "Enter markdown content..." }) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <label className="fw-semibold">Content</label>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? "Edit" : "Preview"}
        </Button>
      </div>
      {showPreview ? (
        <div
          style={{
            minHeight: "300px",
            padding: "var(--spacing-md)",
            backgroundColor: "var(--color-bg-dark)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-text-primary)",
            overflow: "auto",
          }}
        >
          <ReactMarkdown>{value || "*No content*"}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          className="form-control"
          rows={12}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            fontFamily: "monospace",
            backgroundColor: "var(--color-bg-dark)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        />
      )}
    </div>
  );
}

