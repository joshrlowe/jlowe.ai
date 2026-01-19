/**
 * Tests for ProfessionalSummary component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProfessionalSummary from "@/components/About/ProfessionalSummary/ProfessionalSummary";

describe("ProfessionalSummary", () => {
  it("returns null when children is not provided", () => {
    const { container } = render(<ProfessionalSummary />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when children is null", () => {
    const { container } = render(<ProfessionalSummary>{null}</ProfessionalSummary>);
    expect(container.firstChild).toBeNull();
  });

  it("renders section title", () => {
    render(<ProfessionalSummary>Summary content</ProfessionalSummary>);
    expect(screen.getByText("Professional Summary")).toBeInTheDocument();
  });

  it("renders markdown content with testId", () => {
    render(<ProfessionalSummary>Summary content</ProfessionalSummary>);
    expect(screen.getByTestId("professional-summary-content")).toBeInTheDocument();
  });

  it("passes children to MarkdownContent", () => {
    render(<ProfessionalSummary>This is my **professional** summary.</ProfessionalSummary>);
    // MarkdownContent is mocked, so it receives the content as a prop
    expect(screen.getByTestId("professional-summary-content")).toBeInTheDocument();
  });
});

