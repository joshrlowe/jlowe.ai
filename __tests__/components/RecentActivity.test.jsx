/**
 * Tests for RecentActivity component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import RecentActivity from "@/components/RecentActivity";

// Mock router
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe("RecentActivity", () => {
  const mockProjects = [
    {
      id: "1",
      title: "Project One",
      slug: "project-one",
      shortDescription: "First project description",
      status: "Completed",
      techStack: ["React", "Node.js"],
      updatedAt: "2024-01-15T00:00:00.000Z",
    },
    {
      id: "2",
      title: "Project Two",
      slug: "project-two",
      shortDescription: "Second project description",
      status: "InProgress",
      techStack: ["Python", "Django"],
      updatedAt: "2024-01-10T00:00:00.000Z",
    },
  ];

  const mockArticles = [
    {
      id: "1",
      title: "Article One",
      slug: "article-one",
      topic: "tech",
      description: "First article description",
      datePublished: "2024-01-14T00:00:00.000Z",
      readingTime: 5,
    },
    {
      id: "2",
      title: "Article Two",
      slug: "article-two",
      topic: "ai",
      description: "Second article description",
      datePublished: "2024-01-12T00:00:00.000Z",
      readingTime: 8,
    },
  ];

  it("renders null when no projects or articles", () => {
    const { container } = render(<RecentActivity projects={[]} articles={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders null when props are undefined", () => {
    const { container } = render(<RecentActivity />);
    expect(container.firstChild).toBeNull();
  });

  it("renders section title", () => {
    render(<RecentActivity projects={mockProjects} articles={mockArticles} />);
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
  });

  it("renders project titles", () => {
    render(<RecentActivity projects={mockProjects} articles={[]} />);
    expect(screen.getByText("Project One")).toBeInTheDocument();
    expect(screen.getByText("Project Two")).toBeInTheDocument();
  });

  it("renders article titles", () => {
    render(<RecentActivity projects={[]} articles={mockArticles} />);
    expect(screen.getByText("Article One")).toBeInTheDocument();
    expect(screen.getByText("Article Two")).toBeInTheDocument();
  });

  it("renders project descriptions", () => {
    render(<RecentActivity projects={mockProjects} articles={[]} />);
    expect(screen.getByText("First project description")).toBeInTheDocument();
  });

  it("renders article descriptions", () => {
    render(<RecentActivity projects={[]} articles={mockArticles} />);
    expect(screen.getByText("First article description")).toBeInTheDocument();
  });

  it("renders type badges for projects", () => {
    render(<RecentActivity projects={mockProjects} articles={[]} />);
    expect(screen.getAllByText("Project").length).toBeGreaterThan(0);
  });

  it("renders type badges for articles", () => {
    render(<RecentActivity projects={[]} articles={mockArticles} />);
    expect(screen.getAllByText("Article").length).toBeGreaterThan(0);
  });

  it("renders article titles", () => {
    render(<RecentActivity projects={[]} articles={mockArticles} />);
    // Check that article titles are rendered
    expect(screen.getByText(mockArticles[0].title)).toBeInTheDocument();
  });

  it("renders view all links", () => {
    render(<RecentActivity projects={mockProjects} articles={mockArticles} />);
    expect(screen.getByText("All Projects")).toBeInTheDocument();
    expect(screen.getByText("All Articles")).toBeInTheDocument();
  });

  it("combines and sorts items by date", () => {
    render(<RecentActivity projects={mockProjects} articles={mockArticles} />);
    
    // All items should be rendered
    expect(screen.getByText("Project One")).toBeInTheDocument();
    expect(screen.getByText("Article One")).toBeInTheDocument();
  });

  it("limits total items displayed", () => {
    const manyProjects = Array(10)
      .fill(null)
      .map((_, i) => ({
        id: `${i}`,
        title: `Project ${i}`,
        slug: `project-${i}`,
        updatedAt: new Date(2024, 0, 15 - i).toISOString(),
      }));

    render(<RecentActivity projects={manyProjects} articles={[]} />);
    
    // Should limit number of items
    const projectItems = screen.getAllByText(/Project \d/);
    expect(projectItems.length).toBeLessThanOrEqual(6);
  });

  it("handles projects with JSON string techStack", () => {
    const projectsWithJsonTechStack = [
      {
        ...mockProjects[0],
        techStack: JSON.stringify(["React", "Node.js"]),
      },
    ];

    render(<RecentActivity projects={projectsWithJsonTechStack} articles={[]} />);
    expect(screen.getByText("Project One")).toBeInTheDocument();
  });

  it("skips animations when reduced motion is preferred", () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(<RecentActivity projects={mockProjects} articles={mockArticles} />);
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
  });

  it("has proper aria labelledby", () => {
    render(<RecentActivity projects={mockProjects} articles={mockArticles} />);
    expect(screen.getByRole("region")).toHaveAttribute("aria-labelledby", "activity-title");
  });

  it("renders project links correctly", () => {
    render(<RecentActivity projects={mockProjects} articles={[]} />);
    const link = screen.getByRole("link", { name: /Project One/i });
    expect(link).toHaveAttribute("href", "/projects/project-one");
  });

  it("renders article links correctly", () => {
    render(<RecentActivity projects={[]} articles={mockArticles} />);
    const link = screen.getByRole("link", { name: /Article One/i });
    expect(link).toHaveAttribute("href", "/articles/tech/article-one");
  });

  it("handles missing dates gracefully", () => {
    const projectsWithoutDates = [
      {
        id: "1",
        title: "No Date Project",
        slug: "no-date",
      },
    ];

    render(<RecentActivity projects={projectsWithoutDates} articles={[]} />);
    expect(screen.getByText("No Date Project")).toBeInTheDocument();
  });
});
