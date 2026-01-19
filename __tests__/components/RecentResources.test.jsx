/**
 * Tests for RecentResources component
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import RecentResources from "@/components/RecentResources";

// Mock router
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
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

describe("RecentResources", () => {
  const mockResources = [
    {
      id: "1",
      title: "Article One",
      slug: "article-one",
      topic: "tech",
      description: "First article description",
      datePublished: "2024-01-15T00:00:00.000Z",
      readingTime: 5,
      postType: "Article",
    },
    {
      id: "2",
      title: "Article Two",
      slug: "article-two",
      topic: "ai",
      description: "Second article description",
      datePublished: "2024-01-10T00:00:00.000Z",
      readingTime: 8,
      postType: "Article",
    },
    {
      id: "3",
      title: "Video One",
      slug: "video-one",
      topic: "tutorials",
      description: "Video tutorial",
      datePublished: "2024-01-05T00:00:00.000Z",
      postType: "Video",
    },
  ];

  it("returns null when resources is not provided", () => {
    const { container } = render(<RecentResources />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when resources is empty array", () => {
    const { container } = render(<RecentResources resources={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when resources is null", () => {
    const { container } = render(<RecentResources resources={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders section title", () => {
    render(<RecentResources resources={mockResources} />);
    // Check for section with appropriate aria-label
    const section = screen.getByLabelText(/recent articles/i);
    expect(section).toBeInTheDocument();
  });

  it("renders article titles", async () => {
    render(<RecentResources resources={mockResources} />);
    await waitFor(() => {
      expect(screen.getByText("Article One")).toBeInTheDocument();
      expect(screen.getByText("Article Two")).toBeInTheDocument();
    });
  });

  it("renders article descriptions", async () => {
    render(<RecentResources resources={mockResources} />);
    await waitFor(() => {
      expect(screen.getByText("First article description")).toBeInTheDocument();
    });
  });

  it("renders reading time", async () => {
    render(<RecentResources resources={mockResources} />);
    await waitFor(() => {
      expect(screen.getByText("5 min read")).toBeInTheDocument();
    });
  });

  it("limits resources to 3", async () => {
    const manyResources = [
      ...mockResources,
      { id: "4", title: "Article Four", slug: "article-four", topic: "tech" },
      { id: "5", title: "Article Five", slug: "article-five", topic: "tech" },
    ];
    render(<RecentResources resources={manyResources} />);
    
    await waitFor(() => {
      expect(screen.getByText("Article One")).toBeInTheDocument();
      expect(screen.getByText("Article Two")).toBeInTheDocument();
      expect(screen.getByText("Video One")).toBeInTheDocument();
    });
    
    expect(screen.queryByText("Article Four")).not.toBeInTheDocument();
  });

  it("renders View All button", async () => {
    render(<RecentResources resources={mockResources} />);
    await waitFor(() => {
      expect(screen.getByText("View All")).toBeInTheDocument();
    });
  });

  it("formats dates after mount", () => {
    render(<RecentResources resources={mockResources} />);
    // Date formatting happens client-side, check for any date format
    // There may be multiple dates rendered
    const dateElements = screen.getAllByText(/Jan/i);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it("renders resource links", () => {
    render(<RecentResources resources={mockResources} />);
    // Links to articles should be rendered
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
  });

  it("renders article type for videos", async () => {
    render(<RecentResources resources={mockResources} />);
    await waitFor(() => {
      expect(screen.getByText("Video")).toBeInTheDocument();
    });
  });

  it("skips animations when reduced motion is preferred", async () => {
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

    render(<RecentResources resources={mockResources} />);
    
    await waitFor(() => {
      expect(screen.getByText("Article One")).toBeInTheDocument();
    });
  });

  it("has proper section aria label", async () => {
    render(<RecentResources resources={mockResources} />);
    await waitFor(() => {
      expect(screen.getByLabelText("Recent articles")).toBeInTheDocument();
    });
  });
});

