/**
 * Tests for ProjectDescription component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProjectDescription from "@/components/Project/ProjectDescription";

describe("ProjectDescription", () => {
  it("renders description text", () => {
    render(<ProjectDescription description="This is a test project" />);
    expect(screen.getByText("This is a test project")).toBeInTheDocument();
  });

  it("renders empty description", () => {
    const { container } = render(<ProjectDescription description="" />);
    expect(container.querySelector("p")).toBeInTheDocument();
  });

  it("renders null description", () => {
    const { container } = render(<ProjectDescription description={null} />);
    expect(container.querySelector("p")).toBeInTheDocument();
  });

  it("renders long description", () => {
    const longDesc = "A".repeat(500);
    render(<ProjectDescription description={longDesc} />);
    expect(screen.getByText(longDesc)).toBeInTheDocument();
  });

  it("renders description with spaces", () => {
    render(<ProjectDescription description="Line 1   with spaces" />);
    // HTML collapses whitespace, so check for text content
    expect(screen.getByText(/Line 1.*with spaces/)).toBeInTheDocument();
  });
});

