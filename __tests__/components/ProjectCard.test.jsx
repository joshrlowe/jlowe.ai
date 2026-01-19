/**
 * Tests for ProjectCard component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProjectCard from "@/components/Project/ProjectCard";

// Mock router
const mockPush = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Next.js Image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }) => <img src={src} alt={alt} {...props} />,
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

describe("ProjectCard", () => {
  const mockProject = {
    id: "1",
    title: "Test Project",
    slug: "test-project",
    shortDescription: "A test project description",
    status: "Completed",
    featured: false,
    images: JSON.stringify(["/images/test.png"]),
    techStack: JSON.stringify(["React", "Node.js", "MongoDB"]),
    tags: JSON.stringify(["web", "fullstack"]),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders project title", () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });

  it("renders project description", () => {
    render(<ProjectCard project={mockProject} />);
    expect(
      screen.getByText("A test project description"),
    ).toBeInTheDocument();
  });

  it("renders tech stack badges", () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
    expect(screen.getByText("MongoDB")).toBeInTheDocument();
  });

  it("shows +N indicator when more than 3 tech items", () => {
    const projectWithManyTechs = {
      ...mockProject,
      techStack: JSON.stringify([
        "React",
        "Node.js",
        "MongoDB",
        "TypeScript",
        "GraphQL",
      ]),
    };
    render(<ProjectCard project={projectWithManyTechs} />);
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("renders featured badge when project is featured", () => {
    const featuredProject = { ...mockProject, featured: true };
    render(<ProjectCard project={featuredProject} />);
    expect(screen.getByText("Featured")).toBeInTheDocument();
  });

  it("navigates to project page on click", () => {
    render(<ProjectCard project={mockProject} />);
    const card = screen.getByRole("article");
    fireEvent.click(card);
    expect(mockPush).toHaveBeenCalledWith("/projects/test-project");
  });

  it("navigates on Enter key press", () => {
    render(<ProjectCard project={mockProject} />);
    const card = screen.getByRole("article");
    fireEvent.keyDown(card, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/projects/test-project");
  });

  it("navigates on Space key press", () => {
    render(<ProjectCard project={mockProject} />);
    const card = screen.getByRole("article");
    fireEvent.keyDown(card, { key: " " });
    expect(mockPush).toHaveBeenCalledWith("/projects/test-project");
  });

  it("does not navigate on other key presses", () => {
    render(<ProjectCard project={mockProject} />);
    const card = screen.getByRole("article");
    fireEvent.keyDown(card, { key: "Tab" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("uses project id when slug is not available", () => {
    const projectWithoutSlug = { ...mockProject, slug: undefined };
    render(<ProjectCard project={projectWithoutSlug} />);
    const card = screen.getByRole("article");
    fireEvent.click(card);
    expect(mockPush).toHaveBeenCalledWith("/projects/1");
  });

  it("handles images as array of objects", () => {
    const projectWithImageObjects = {
      ...mockProject,
      images: JSON.stringify([{ url: "/images/test.png" }]),
    };
    render(<ProjectCard project={projectWithImageObjects} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/images/test.png");
  });

  it("handles images with src property", () => {
    const projectWithSrcImages = {
      ...mockProject,
      images: JSON.stringify([{ src: "/images/test.png" }]),
    };
    render(<ProjectCard project={projectWithSrcImages} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/images/test.png");
  });

  it("shows placeholder when no images", () => {
    const projectWithoutImages = {
      ...mockProject,
      images: "[]",
    };
    render(<ProjectCard project={projectWithoutImages} />);
    expect(screen.getByText("T")).toBeInTheDocument(); // First letter of title
  });

  it("handles non-array images field", () => {
    const projectWithInvalidImages = {
      ...mockProject,
      images: "not-an-array",
    };
    render(<ProjectCard project={projectWithInvalidImages} />);
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("handles already parsed arrays", () => {
    const projectWithParsedArrays = {
      ...mockProject,
      images: ["/images/test.png"],
      techStack: ["React", "Vue"],
    };
    render(<ProjectCard project={projectWithParsedArrays} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Vue")).toBeInTheDocument();
  });

  it("renders StatusBadge with correct status", () => {
    render(<ProjectCard project={mockProject} />);
    // StatusBadge should be rendered with status
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(<ProjectCard project={mockProject} />);
    const card = screen.getByRole("article");
    expect(card).toHaveAttribute("tabIndex", "0");
    expect(card).toHaveAttribute(
      "aria-label",
      "View project: Test Project",
    );
  });

  it("skips animation when reduced motion is preferred", () => {
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

    render(<ProjectCard project={mockProject} index={0} />);
    // Component should render without throwing
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });

  it("renders without shortDescription", () => {
    const projectWithoutDesc = {
      ...mockProject,
      shortDescription: undefined,
    };
    render(<ProjectCard project={projectWithoutDesc} />);
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });

  it("renders without techStack", () => {
    const projectWithoutTech = {
      ...mockProject,
      techStack: undefined,
    };
    render(<ProjectCard project={projectWithoutTech} />);
    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.queryByText("React")).not.toBeInTheDocument();
  });
});

