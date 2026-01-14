/**
 * Tests for MarkdownContent component
 *
 * Tests:
 * - Basic markdown rendering
 * - Different style variants
 * - Conditional rendering for empty content
 * - GitHub-flavored markdown features
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import MarkdownContent from "@/components/ui/MarkdownContent";

// Note: react-markdown is mocked in jest.config.js
// These tests verify the component's integration behavior

describe("MarkdownContent", () => {
  describe("rendering", () => {
    it("should render nothing when content is null", () => {
      const { container } = render(<MarkdownContent content={null} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render nothing when content is undefined", () => {
      const { container } = render(<MarkdownContent />);
      expect(container.firstChild).toBeNull();
    });

    it("should render nothing when content is empty string", () => {
      const { container } = render(<MarkdownContent content="" />);
      expect(container.firstChild).toBeNull();
    });

    it("should render content when provided", () => {
      render(<MarkdownContent content="Hello World" />);
      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });
  });

  describe("markdown content", () => {
    it("should render plain text content", () => {
      render(<MarkdownContent content="This is plain text" />);
      expect(screen.getByText("This is plain text")).toBeInTheDocument();
    });

    it("should render content with bold markdown syntax", () => {
      render(<MarkdownContent content="This is **bold** text" />);
      // The mock converts markdown to HTML
      expect(screen.getByTestId("react-markdown")).toBeInTheDocument();
      expect(screen.getByText("bold")).toBeInTheDocument();
    });

    it("should render content with list markdown syntax", () => {
      const listContent = `
- Item 1
- Item 2
- Item 3
      `;
      render(<MarkdownContent content={listContent} />);
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });

    it("should render content with link markdown syntax", () => {
      render(<MarkdownContent content="Check [this link](https://example.com)" />);
      expect(screen.getByRole("link", { name: "this link" })).toBeInTheDocument();
    });

    it("should render content with code markdown syntax", () => {
      render(<MarkdownContent content="Use `code` inline" />);
      expect(screen.getByText("code")).toBeInTheDocument();
    });

    it("should render content with heading markdown syntax", () => {
      render(<MarkdownContent content="## Heading 2" />);
      expect(screen.getByRole("heading", { level: 2, name: "Heading 2" })).toBeInTheDocument();
    });
  });

  describe("style variants", () => {
    it("should apply default variant styles when no variant specified", () => {
      render(<MarkdownContent content="Default styled" />);
      const container = screen.getByTestId("react-markdown").parentElement;
      expect(container.className).toContain("prose");
      expect(container.className).toContain("prose-invert");
    });

    it("should apply compact variant styles", () => {
      render(<MarkdownContent content="Compact styled" variant="compact" />);
      const container = screen.getByTestId("react-markdown").parentElement;
      expect(container.className).toContain("prose-sm");
    });

    it("should apply inline variant styles", () => {
      render(<MarkdownContent content="Inline styled" variant="inline" />);
      const container = screen.getByTestId("react-markdown").parentElement;
      expect(container.className).toContain("prose-sm");
    });

    it("should fall back to default variant for unknown variants", () => {
      render(<MarkdownContent content="Unknown variant" variant="unknown" />);
      const container = screen.getByTestId("react-markdown").parentElement;
      expect(container.className).toContain("prose");
    });
  });

  describe("custom props", () => {
    it("should apply custom className", () => {
      render(<MarkdownContent content="Custom class" className="my-custom-class" />);
      const container = screen.getByTestId("react-markdown").parentElement;
      expect(container.className).toContain("my-custom-class");
    });

    it("should apply data-testid when provided", () => {
      render(<MarkdownContent content="With testId" testId="my-test-id" />);
      expect(screen.getByTestId("my-test-id")).toBeInTheDocument();
    });

    it("should combine variant styles with custom className", () => {
      render(
        <MarkdownContent
          content="Combined"
          variant="compact"
          className="extra-class"
        />
      );
      const container = screen.getByTestId("react-markdown").parentElement;
      expect(container.className).toContain("prose-sm");
      expect(container.className).toContain("extra-class");
    });
  });

  describe("GitHub-flavored markdown", () => {
    it("should render table markdown", () => {
      const tableContent = `
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
      `;
      render(<MarkdownContent content={tableContent} />);
      expect(screen.getByText("Header 1")).toBeInTheDocument();
      expect(screen.getByText("Cell 1")).toBeInTheDocument();
    });

    it("should render strikethrough markdown", () => {
      render(<MarkdownContent content="This is ~~strikethrough~~ text" />);
      expect(screen.getByText("strikethrough")).toBeInTheDocument();
    });

    it("should render task list markdown", () => {
      const taskList = `
- [x] Completed task
- [ ] Pending task
      `;
      render(<MarkdownContent content={taskList} />);
      expect(screen.getByText("Completed task")).toBeInTheDocument();
      expect(screen.getByText("Pending task")).toBeInTheDocument();
    });
  });

  describe("snapshots", () => {
    it("should match snapshot for default variant", () => {
      const { container } = render(
        <MarkdownContent content="**Bold** and *italic* text" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it("should match snapshot for compact variant", () => {
      const { container } = render(
        <MarkdownContent content="Compact content" variant="compact" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

