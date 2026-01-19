/**
 * Tests for ProjectSkeleton component
 */

import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProjectSkeleton from "@/components/Project/ProjectSkeleton";

describe("ProjectSkeleton", () => {
  it("renders skeleton loader", () => {
    const { container } = render(<ProjectSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("has animate-pulse class", () => {
    const { container } = render(<ProjectSkeleton />);
    expect(container.firstChild).toHaveClass("animate-pulse");
  });

  it("renders placeholder elements", () => {
    const { container } = render(<ProjectSkeleton />);
    // Should have multiple placeholder divs
    const placeholders = container.querySelectorAll("div");
    expect(placeholders.length).toBeGreaterThan(3);
  });

  it("has proper structure", () => {
    const { container } = render(<ProjectSkeleton />);
    // Image placeholder area
    const imagePlaceholder = container.querySelector(".h-48");
    expect(imagePlaceholder).toBeInTheDocument();
    // Content area
    const contentArea = container.querySelector(".p-6");
    expect(contentArea).toBeInTheDocument();
  });
});

