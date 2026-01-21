/**
 * Tests for LeadershipExperience component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import LeadershipExperience from "@/components/About/LeadershipExperience/LeadershipExperience";

// Mock MarkdownContent component
jest.mock("@/components/ui", () => ({
  MarkdownContent: ({ content, variant }) => (
    <div data-testid="mock-markdown-content" data-variant={variant}>
      {content}
    </div>
  ),
}));

describe("LeadershipExperience", () => {
  const mockExperience = [
    {
      role: "Team Lead",
      organization: "Tech Company",
      startDate: "2022-01-15",
      endDate: "",
      description: "Led a team of 10 engineers building **core platform features**.",
    },
    {
      title: "Project Manager",
      company: "Startup Inc",
      startDate: "2020-06-01",
      endDate: "2021-12-31",
      description: "Managed multiple projects and delivered on time.",
    },
  ];

  it("returns null when experience is not provided", () => {
    const { container } = render(<LeadershipExperience />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when experience is null", () => {
    const { container } = render(<LeadershipExperience experience={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when experience is empty array", () => {
    const { container } = render(<LeadershipExperience experience={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders section title", () => {
    render(<LeadershipExperience experience={mockExperience} />);
    expect(screen.getByText("Leadership Experience")).toBeInTheDocument();
  });

  it("renders section subtitle when provided", () => {
    render(
      <LeadershipExperience
        experience={mockExperience}
        subtitle="Leading teams and driving organizational impact"
      />
    );
    expect(
      screen.getByText("Leading teams and driving organizational impact"),
    ).toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    render(<LeadershipExperience experience={mockExperience} />);
    expect(
      screen.queryByText("Leading teams and driving organizational impact"),
    ).not.toBeInTheDocument();
  });

  it("renders experience role", () => {
    render(<LeadershipExperience experience={mockExperience} />);
    expect(screen.getByText("Team Lead")).toBeInTheDocument();
  });

  it("renders experience title when role is not provided", () => {
    render(<LeadershipExperience experience={mockExperience} />);
    expect(screen.getByText("Project Manager")).toBeInTheDocument();
  });

  it("renders organization", () => {
    render(<LeadershipExperience experience={mockExperience} />);
    expect(screen.getByText("Tech Company")).toBeInTheDocument();
  });

  it("renders company when organization is not provided", () => {
    render(<LeadershipExperience experience={mockExperience} />);
    expect(screen.getByText("Startup Inc")).toBeInTheDocument();
  });

  it("renders description using MarkdownContent", () => {
    render(<LeadershipExperience experience={mockExperience} />);
    const markdownContents = screen.getAllByTestId("mock-markdown-content");
    expect(markdownContents.length).toBeGreaterThan(0);
    expect(markdownContents[0]).toHaveTextContent("Led a team of 10 engineers");
  });

  it("uses compact variant for MarkdownContent", () => {
    render(<LeadershipExperience experience={mockExperience} />);
    const markdownContents = screen.getAllByTestId("mock-markdown-content");
    expect(markdownContents[0]).toHaveAttribute("data-variant", "compact");
  });

  it("renders multiple experiences", () => {
    render(<LeadershipExperience experience={mockExperience} />);
    expect(screen.getByText("Team Lead")).toBeInTheDocument();
    expect(screen.getByText("Project Manager")).toBeInTheDocument();
  });

  it("renders with position field as fallback", () => {
    const experience = [{ position: "Director", organization: "Org", description: "Leadership role" }];
    render(<LeadershipExperience experience={experience} />);
    expect(screen.getByText("Director")).toBeInTheDocument();
  });

  it("renders date range with formatted dates", () => {
    render(<LeadershipExperience experience={mockExperience} />);
    // First entry has no end date, should show "Present"
    expect(screen.getByText(/January 2022 - Present/)).toBeInTheDocument();
  });

  it("sorts experiences by date descending (most recent first)", () => {
    const { container } = render(<LeadershipExperience experience={mockExperience} />);
    const entries = container.querySelectorAll("h3");
    // Team Lead (2022) should come before Project Manager (2020)
    expect(entries[0]).toHaveTextContent("Team Lead");
    expect(entries[1]).toHaveTextContent("Project Manager");
  });

  it("does not render description section when description is empty", () => {
    const experienceWithoutDescription = [
      {
        role: "Lead",
        organization: "No Desc Org",
        startDate: "2020-01-01",
      },
    ];
    
    render(<LeadershipExperience experience={experienceWithoutDescription} />);
    expect(screen.queryByTestId("mock-markdown-content")).not.toBeInTheDocument();
  });
});
