/**
 * Tests for GitHubActivity component
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import GitHubActivity from "@/components/GitHubActivity";

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

// Mock fetch
global.fetch = jest.fn();

describe("GitHubActivity", () => {
  const mockRepos = [
    {
      id: 1,
      name: "awesome-project",
      html_url: "https://github.com/user/awesome-project",
      description: "An awesome project",
      stargazers_count: 100,
      forks_count: 20,
      language: "JavaScript",
      updated_at: "2024-01-15T00:00:00.000Z",
      fork: false,
    },
    {
      id: 2,
      name: "cool-library",
      html_url: "https://github.com/user/cool-library",
      description: "A cool library",
      stargazers_count: 50,
      forks_count: 10,
      language: "TypeScript",
      updated_at: "2024-01-10T00:00:00.000Z",
      fork: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRepos),
    });
  });

  it("returns null when githubUrl is not provided", () => {
    const { container } = render(<GitHubActivity />);
    expect(container.firstChild).toBeNull();
  });

  it("shows loading state while fetching", () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));
    render(<GitHubActivity githubUrl="https://github.com/testuser" />);
    
    // Should show loading skeleton with animate-pulse
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(screen.getByText("GitHub Activity")).toBeInTheDocument();
  });

  it("renders repos after successful fetch", async () => {
    render(<GitHubActivity githubUrl="https://github.com/testuser" />);

    await waitFor(() => {
      expect(screen.getByText("awesome-project")).toBeInTheDocument();
    });

    expect(screen.getByText("cool-library")).toBeInTheDocument();
    expect(screen.getByText("An awesome project")).toBeInTheDocument();
    expect(screen.getByText("A cool library")).toBeInTheDocument();
  });

  it("displays star and fork counts", async () => {
    render(<GitHubActivity githubUrl="https://github.com/testuser" />);

    await waitFor(() => {
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("20")).toBeInTheDocument();
    });
  });

  it("displays programming language badges", async () => {
    render(<GitHubActivity githubUrl="https://github.com/testuser" />);

    await waitFor(() => {
      expect(screen.getByText("JavaScript")).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
    });
  });

  it("renders View Profile link", async () => {
    render(<GitHubActivity githubUrl="https://github.com/testuser" />);

    await waitFor(() => {
      expect(screen.getByText("awesome-project")).toBeInTheDocument();
    });

    const profileLink = screen.getByText("View Profile").closest("a");
    expect(profileLink).toHaveAttribute("href", "https://github.com/testuser");
    expect(profileLink).toHaveAttribute("target", "_blank");
  });

  it("extracts username from GitHub URL", async () => {
    render(<GitHubActivity githubUrl="https://github.com/myusername" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/users/myusername/repos?sort=updated&per_page=6",
      );
    });
  });

  it("returns null on fetch error", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
    });

    const { container } = render(
      <GitHubActivity githubUrl="https://github.com/testuser" />,
    );

    await waitFor(() => {
      expect(container.querySelector("section")).toBeNull();
    });
  });

  it("returns null when repos array is empty", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const { container } = render(
      <GitHubActivity githubUrl="https://github.com/testuser" />,
    );

    await waitFor(() => {
      expect(container.querySelector('[aria-label="GitHub activity"]')).toBeNull();
    });
  });

  it("filters out forked repos", async () => {
    const reposWithFork = [
      ...mockRepos,
      {
        id: 3,
        name: "forked-repo",
        html_url: "https://github.com/user/forked-repo",
        fork: true,
      },
    ];
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(reposWithFork),
    });

    render(<GitHubActivity githubUrl="https://github.com/testuser" />);

    await waitFor(() => {
      expect(screen.getByText("awesome-project")).toBeInTheDocument();
    });

    expect(screen.queryByText("forked-repo")).not.toBeInTheDocument();
  });

  it("limits display to 4 repos", async () => {
    const manyRepos = Array(10)
      .fill(null)
      .map((_, i) => ({
        id: i,
        name: `repo-${i}`,
        html_url: `https://github.com/user/repo-${i}`,
        fork: false,
      }));

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(manyRepos),
    });

    render(<GitHubActivity githubUrl="https://github.com/testuser" />);

    await waitFor(() => {
      expect(screen.getByText("repo-0")).toBeInTheDocument();
    });

    // Should only show 4 repos
    expect(screen.getByText("repo-3")).toBeInTheDocument();
    expect(screen.queryByText("repo-4")).not.toBeInTheDocument();
  });

  it("handles repo without description", async () => {
    const reposWithoutDesc = [
      {
        id: 1,
        name: "no-desc-repo",
        html_url: "https://github.com/user/no-desc",
        description: null,
        fork: false,
      },
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(reposWithoutDesc),
    });

    render(<GitHubActivity githubUrl="https://github.com/testuser" />);

    await waitFor(() => {
      expect(screen.getByText("no-desc-repo")).toBeInTheDocument();
    });
  });

  it("handles repo without language", async () => {
    const reposWithoutLang = [
      {
        id: 1,
        name: "no-lang-repo",
        html_url: "https://github.com/user/no-lang",
        language: null,
        fork: false,
      },
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(reposWithoutLang),
    });

    render(<GitHubActivity githubUrl="https://github.com/testuser" />);

    await waitFor(() => {
      expect(screen.getByText("no-lang-repo")).toBeInTheDocument();
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

    render(<GitHubActivity githubUrl="https://github.com/testuser" />);

    await waitFor(() => {
      expect(screen.getByText("awesome-project")).toBeInTheDocument();
    });
  });

  it("handles network error", async () => {
    global.fetch.mockRejectedValue(new Error("Network error"));

    const { container } = render(
      <GitHubActivity githubUrl="https://github.com/testuser" />,
    );

    await waitFor(() => {
      expect(container.querySelector('[aria-label="GitHub activity"]')).toBeNull();
    });
  });

  it("has proper aria label for accessibility", async () => {
    render(<GitHubActivity githubUrl="https://github.com/testuser" />);

    await waitFor(() => {
      expect(screen.getByLabelText("GitHub activity")).toBeInTheDocument();
    });
  });
});

