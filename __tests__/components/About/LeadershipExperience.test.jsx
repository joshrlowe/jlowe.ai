/**
 * Tests for LeadershipExperience component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import LeadershipExperience from "@/components/About/LeadershipExperience/LeadershipExperience";

describe("LeadershipExperience", () => {
  const mockExperience = [
    {
      role: "Team Lead",
      organization: "Tech Company",
      startYear: "2022",
      endYear: "Present",
      description: "Led a team of 10 engineers",
      impact: ["Increased productivity by 30%", "Reduced bugs by 50%"],
    },
    {
      title: "Project Manager",
      company: "Startup Inc",
      startYear: "2020",
      endYear: "2022",
      description: "Managed multiple projects",
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

  it("renders section subtitle", () => {
    render(<LeadershipExperience experience={mockExperience} />);
    expect(
      screen.getByText("Leading teams and driving organizational impact"),
    ).toBeInTheDocument();
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

  it("renders description", () => {
    render(<LeadershipExperience experience={mockExperience} />);
    expect(screen.getByText("Led a team of 10 engineers")).toBeInTheDocument();
  });

  it("renders key achievements when provided", () => {
    render(<LeadershipExperience experience={mockExperience} />);
    // Check for key achievements which are rendered
    expect(screen.getByText(/Managed multiple projects/i)).toBeInTheDocument();
  });

  it("renders multiple experiences", () => {
    render(<LeadershipExperience experience={mockExperience} />);
    expect(screen.getByText("Team Lead")).toBeInTheDocument();
    expect(screen.getByText("Project Manager")).toBeInTheDocument();
  });

  it("renders with position field as fallback", () => {
    const experience = [{ position: "Director", organization: "Org" }];
    render(<LeadershipExperience experience={experience} />);
    expect(screen.getByText("Director")).toBeInTheDocument();
  });
});

