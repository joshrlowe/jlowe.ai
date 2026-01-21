/**
 * Tests for MarkdownEditor Component
 *
 * Tests the markdown editor with:
 * - Edit/Preview mode toggle
 * - Markdown rendering with react-markdown
 * - GitHub-flavored markdown support
 * - Customizable props
 * - Accessibility
 */

import React from "react";
import { screen, renderWithoutProviders, waitFor } from "@/test-utils";
import { axe, toHaveNoViolations } from "jest-axe";
import MarkdownEditor from "@/components/admin/MarkdownEditor";

expect.extend(toHaveNoViolations);

describe("MarkdownEditor", () => {
  const defaultProps = {
    value: "",
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render without crashing", () => {
      renderWithoutProviders(<MarkdownEditor {...defaultProps} />);
      expect(screen.getByTestId("markdown-editor")).toBeInTheDocument();
    });

    it("should render default label", () => {
      renderWithoutProviders(<MarkdownEditor {...defaultProps} />);
      expect(screen.getByText("Content (Markdown)")).toBeInTheDocument();
    });

    it("should render custom label", () => {
      renderWithoutProviders(
        <MarkdownEditor {...defaultProps} label="Custom Label" />
      );
      expect(screen.getByText("Custom Label")).toBeInTheDocument();
    });

    it("should render Edit and Preview buttons", () => {
      renderWithoutProviders(<MarkdownEditor {...defaultProps} />);
      expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Preview" })).toBeInTheDocument();
    });

  });

  describe("edit mode", () => {
    it("should start in edit mode by default", () => {
      renderWithoutProviders(<MarkdownEditor {...defaultProps} />);
      expect(screen.getByTestId("markdown-editor")).toBeInTheDocument();
      expect(screen.queryByTestId("markdown-preview")).not.toBeInTheDocument();
    });

    it("should display textarea with value", () => {
      renderWithoutProviders(
        <MarkdownEditor {...defaultProps} value="Test content" />
      );
      expect(screen.getByTestId("markdown-editor")).toHaveValue("Test content");
    });

    it("should use custom placeholder", () => {
      renderWithoutProviders(
        <MarkdownEditor {...defaultProps} placeholder="Type here..." />
      );
      expect(screen.getByPlaceholderText("Type here...")).toBeInTheDocument();
    });

    it("should call onChange when typing", async () => {
      const onChange = jest.fn();
      const { user } = renderWithoutProviders(
        <MarkdownEditor {...defaultProps} onChange={onChange} />
      );

      await user.type(screen.getByTestId("markdown-editor"), "Hello");
      expect(onChange).toHaveBeenCalled();
    });

    it("should apply custom rows", () => {
      renderWithoutProviders(<MarkdownEditor {...defaultProps} rows={12} />);
      expect(screen.getByTestId("markdown-editor")).toHaveAttribute("rows", "12");
    });

    it("should have Edit button active/highlighted", () => {
      renderWithoutProviders(<MarkdownEditor {...defaultProps} />);
      const editButton = screen.getByRole("button", { name: "Edit" });
      expect(editButton.className).toContain("bg-[var(--color-primary)]");
    });
  });

  describe("preview mode", () => {
    it("should switch to preview mode when Preview clicked", async () => {
      const { user } = renderWithoutProviders(
        <MarkdownEditor {...defaultProps} value="# Hello" />
      );

      await user.click(screen.getByRole("button", { name: "Preview" }));

      expect(screen.getByTestId("markdown-preview")).toBeInTheDocument();
      expect(screen.queryByTestId("markdown-editor")).not.toBeInTheDocument();
    });

    it("should have Preview button active when in preview mode", async () => {
      const { user } = renderWithoutProviders(
        <MarkdownEditor {...defaultProps} value="# Hello" />
      );

      await user.click(screen.getByRole("button", { name: "Preview" }));

      const previewButton = screen.getByRole("button", { name: "Preview" });
      expect(previewButton.className).toContain("bg-[var(--color-primary)]");
    });

    it("should switch back to edit mode when Edit clicked", async () => {
      const { user } = renderWithoutProviders(
        <MarkdownEditor {...defaultProps} value="# Hello" />
      );

      await user.click(screen.getByRole("button", { name: "Preview" }));
      await user.click(screen.getByRole("button", { name: "Edit" }));

      expect(screen.getByTestId("markdown-editor")).toBeInTheDocument();
      expect(screen.queryByTestId("markdown-preview")).not.toBeInTheDocument();
    });

    it("should hide markdown help hint in preview mode", async () => {
      const { user } = renderWithoutProviders(
        <MarkdownEditor {...defaultProps} value="# Hello" />
      );

      await user.click(screen.getByRole("button", { name: "Preview" }));

      expect(screen.queryByText(/Supports Markdown:/)).not.toBeInTheDocument();
    });
  });

  describe("markdown rendering", () => {
    it("should render heading", async () => {
      const { user } = renderWithoutProviders(
        <MarkdownEditor {...defaultProps} value="# Heading 1" />
      );

      await user.click(screen.getByRole("button", { name: "Preview" }));

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Heading 1"
      );
    });

    it("should render paragraph", async () => {
      const { user } = renderWithoutProviders(
        <MarkdownEditor {...defaultProps} value="This is a paragraph." />
      );

      await user.click(screen.getByRole("button", { name: "Preview" }));

      expect(screen.getByText("This is a paragraph.")).toBeInTheDocument();
    });

    it("should render bold text", async () => {
      const { user } = renderWithoutProviders(
        <MarkdownEditor {...defaultProps} value="This is **bold** text." />
      );

      await user.click(screen.getByRole("button", { name: "Preview" }));

      expect(screen.getByText("bold")).toBeInTheDocument();
    });

    it("should render italic text", async () => {
      const { user } = renderWithoutProviders(
        <MarkdownEditor {...defaultProps} value="This is *italic* text." />
      );

      await user.click(screen.getByRole("button", { name: "Preview" }));

      expect(screen.getByText("italic")).toBeInTheDocument();
    });

    it("should render links", async () => {
      const { user } = renderWithoutProviders(
        <MarkdownEditor
          {...defaultProps}
          value="Check out [this link](https://example.com)."
        />
      );

      await user.click(screen.getByRole("button", { name: "Preview" }));

      const link = screen.getByRole("link", { name: "this link" });
      expect(link).toHaveAttribute("href", "https://example.com");
    });

    it("should render unordered list content", async () => {
      const { user, container } = renderWithoutProviders(
        <MarkdownEditor
          {...defaultProps}
          value="- Item 1\n- Item 2\n- Item 3"
        />
      );

      await user.click(screen.getByRole("button", { name: "Preview" }));

      // In the mock, list items are rendered - check the preview contains the content
      const preview = screen.getByTestId("markdown-preview");
      expect(preview).toBeInTheDocument();
      expect(preview.textContent).toContain("Item 1");
      expect(preview.textContent).toContain("Item 2");
    });

    it("should render ordered list content", async () => {
      const { user } = renderWithoutProviders(
        <MarkdownEditor
          {...defaultProps}
          value="1. First\n2. Second\n3. Third"
        />
      );

      await user.click(screen.getByRole("button", { name: "Preview" }));

      const preview = screen.getByTestId("markdown-preview");
      expect(preview).toBeInTheDocument();
      expect(preview.textContent).toContain("First");
      expect(preview.textContent).toContain("Second");
    });

    it("should render code inline", async () => {
      const { user } = renderWithoutProviders(
        <MarkdownEditor {...defaultProps} value="Use `const` for constants." />
      );

      await user.click(screen.getByRole("button", { name: "Preview" }));

      expect(screen.getByText("const")).toBeInTheDocument();
    });

    it("should render code blocks", async () => {
      const { user } = renderWithoutProviders(
        <MarkdownEditor
          {...defaultProps}
          value={'```javascript\nconst x = 1;\n```'}
        />
      );

      await user.click(screen.getByRole("button", { name: "Preview" }));

      expect(screen.getByText(/const x = 1/)).toBeInTheDocument();
    });
  });

  describe("GitHub-flavored markdown", () => {
    it("should render strikethrough text", async () => {
      const { user } = renderWithoutProviders(
        <MarkdownEditor {...defaultProps} value="~~strikethrough~~" />
      );

      await user.click(screen.getByRole("button", { name: "Preview" }));

      expect(screen.getByText("strikethrough")).toBeInTheDocument();
    });

    it("should render tables", async () => {
      const tableMarkdown = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
      `.trim();

      const { user } = renderWithoutProviders(
        <MarkdownEditor {...defaultProps} value={tableMarkdown} />
      );

      await user.click(screen.getByRole("button", { name: "Preview" }));

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getByText("Header 1")).toBeInTheDocument();
      expect(screen.getByText("Cell 1")).toBeInTheDocument();
    });

    it("should render task lists content", async () => {
      const { user } = renderWithoutProviders(
        <MarkdownEditor
          {...defaultProps}
          value="- [x] Done\n- [ ] Not done"
        />
      );

      await user.click(screen.getByRole("button", { name: "Preview" }));

      const preview = screen.getByTestId("markdown-preview");
      expect(preview).toBeInTheDocument();
      expect(preview.textContent).toContain("Done");
      expect(preview.textContent).toContain("Not done");
    });
  });

  describe("empty state", () => {
    it("should show empty message when no content in preview", async () => {
      const { user } = renderWithoutProviders(
        <MarkdownEditor {...defaultProps} value="" />
      );

      await user.click(screen.getByRole("button", { name: "Preview" }));

      expect(
        screen.getByText("Nothing to preview. Start typing in the editor.")
      ).toBeInTheDocument();
    });
  });

  describe("className prop", () => {
    it("should apply custom className", () => {
      const { container } = renderWithoutProviders(
        <MarkdownEditor {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("accessibility", () => {
    it("should have no accessibility violations in edit mode", async () => {
      const { container } = renderWithoutProviders(
        <MarkdownEditor {...defaultProps} value="Test content" />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no accessibility violations in preview mode", async () => {
      const { user, container } = renderWithoutProviders(
        <MarkdownEditor {...defaultProps} value="# Hello World" />
      );

      await user.click(screen.getByRole("button", { name: "Preview" }));

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have button type on toggle buttons", () => {
      renderWithoutProviders(<MarkdownEditor {...defaultProps} />);

      expect(screen.getByRole("button", { name: "Edit" })).toHaveAttribute(
        "type",
        "button"
      );
      expect(screen.getByRole("button", { name: "Preview" })).toHaveAttribute(
        "type",
        "button"
      );
    });
  });
});

