/**
 * Tests for ProjectHeader component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProjectHeader from "@/components/Project/ProjectHeader";

describe("ProjectHeader", () => {
  it("renders project title", () => {
    render(<ProjectHeader title="My Project" />);
    expect(screen.getByText("My Project")).toBeInTheDocument();
  });

  it("renders source code link when repositoryLink is provided", () => {
    render(
      <ProjectHeader title="Test" repositoryLink="https://github.com/test" />,
    );
    const link = screen.getByText("Source Code");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://github.com/test");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("shows no source code message when repositoryLink is not provided", () => {
    render(<ProjectHeader title="Test" />);
    expect(
      screen.getByText("Source code not available - Contact me for a demo."),
    ).toBeInTheDocument();
  });

  it("shows no source code message when repositoryLink is empty", () => {
    render(<ProjectHeader title="Test" repositoryLink="" />);
    expect(
      screen.getByText("Source code not available - Contact me for a demo."),
    ).toBeInTheDocument();
  });

  it("shows no source code message when repositoryLink is null", () => {
    render(<ProjectHeader title="Test" repositoryLink={null} />);
    expect(
      screen.getByText("Source code not available - Contact me for a demo."),
    ).toBeInTheDocument();
  });

  it("renders title in h2 element", () => {
    render(<ProjectHeader title="Test Project" />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Test Project",
    );
  });
});

