/**
 * Tests for Article Detail Page
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ArticleDetailPage, {
  getStaticPaths,
  getStaticProps,
} from "@/pages/articles/[topic]/[slug]";

// Mock router
jest.mock("next/router", () => ({
  useRouter: () => ({
    isFallback: false,
    query: { topic: "tech", slug: "test-article" },
  }),
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ liked: false, likeCount: 5 }),
  }),
);

// Mock Prisma - use the actual mock from __mocks__
import prisma from "@/lib/prisma";
jest.mock("@/lib/prisma");

// Shared mock post data
const mockPost = {
  id: "1",
  title: "Test Article",
  slug: "test-article",
  topic: "tech",
  description: "A test article description",
  content: "# Test Content\n\nThis is the article body.",
  author: "John Doe",
  datePublished: "2024-01-15T12:00:00.000Z",
  readingTime: 5,
  viewCount: 100,
  postType: "Article",
  coverImage: "/images/test.png",
  tags: ["javascript", "react"],
  _count: { comments: 3, likes: 10 },
  status: "Published",
};

describe("ArticleDetailPage", () => {

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  it("renders article title", () => {
    render(<ArticleDetailPage post={mockPost} />);
    expect(screen.getByText("Test Article")).toBeInTheDocument();
  });

  it("renders article description", () => {
    render(<ArticleDetailPage post={mockPost} />);
    expect(
      screen.getByText("A test article description"),
    ).toBeInTheDocument();
  });

  it("renders author name", () => {
    render(<ArticleDetailPage post={mockPost} />);
    expect(screen.getByText("By John Doe")).toBeInTheDocument();
  });

  it("renders reading time", () => {
    render(<ArticleDetailPage post={mockPost} />);
    expect(screen.getByText("5 min read")).toBeInTheDocument();
  });

  it("renders view count", () => {
    render(<ArticleDetailPage post={mockPost} />);
    expect(screen.getByText("100 views")).toBeInTheDocument();
  });

  it("renders topic badge", () => {
    render(<ArticleDetailPage post={mockPost} />);
    expect(screen.getByText("tech")).toBeInTheDocument();
  });

  it("renders tags", () => {
    render(<ArticleDetailPage post={mockPost} />);
    expect(screen.getByText("javascript")).toBeInTheDocument();
    expect(screen.getByText("react")).toBeInTheDocument();
  });

  it("formats date correctly", () => {
    render(<ArticleDetailPage post={mockPost} />);
    // Date may be formatted differently by locale - check for any reasonable format
    const dateEl = screen.getByText(/Jan(uary)?\s*15/i);
    expect(dateEl).toBeInTheDocument();
  });

  it("fetches like status on mount", async () => {
    render(<ArticleDetailPage post={mockPost} />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/posts/tech/test-article/like",
      );
    });
  });

  it("renders loading state when isFallback is true", () => {
    jest.spyOn(require("next/router"), "useRouter").mockReturnValue({
      isFallback: true,
      query: {},
    });
    render(<ArticleDetailPage post={null} />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders loading state when post is null", () => {
    render(<ArticleDetailPage post={null} />);
    // Should show loading spinner
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders markdown content for articles", () => {
    render(<ArticleDetailPage post={mockPost} />);
    // ReactMarkdown mock should be rendered - check for the article body content
    expect(screen.getByText(/Test Content/i)).toBeInTheDocument();
  });

  it("renders no content message when no content", () => {
    const postWithoutContent = {
      ...mockPost,
      content: null,
      postType: "Article",
    };
    render(<ArticleDetailPage post={postWithoutContent} />);
    expect(screen.getByText("No content available.")).toBeInTheDocument();
  });

  it("renders video iframe for video posts", () => {
    const videoPost = {
      ...mockPost,
      postType: "Video",
      url: "https://youtube.com/embed/test",
    };
    render(<ArticleDetailPage post={videoPost} />);
    const iframe = document.querySelector("iframe");
    expect(iframe).toHaveAttribute("src", "https://youtube.com/embed/test");
  });

  it("does not render video iframe for non-video posts", () => {
    render(<ArticleDetailPage post={mockPost} />);
    expect(document.querySelector("iframe")).not.toBeInTheDocument();
  });

  it("renders cover image when provided", () => {
    render(<ArticleDetailPage post={mockPost} />);
    const img = screen.getByAltText("Test Article");
    expect(img).toBeInTheDocument();
  });

  it("does not render cover image section when not provided", () => {
    const postWithoutImage = { ...mockPost, coverImage: null };
    render(<ArticleDetailPage post={postWithoutImage} />);
    expect(screen.queryByAltText("Test Article")).not.toBeInTheDocument();
  });

  it("does not render tags when empty", () => {
    const postWithoutTags = { ...mockPost, tags: [] };
    render(<ArticleDetailPage post={postWithoutTags} />);
    expect(screen.queryByText("javascript")).not.toBeInTheDocument();
  });

  it("handles missing datePublished", () => {
    const postWithoutDate = { ...mockPost, datePublished: null };
    render(<ArticleDetailPage post={postWithoutDate} />);
    expect(screen.queryByText(/\d{4}/)).not.toBeInTheDocument();
  });

  it("handles missing readingTime", () => {
    const postWithoutReadingTime = { ...mockPost, readingTime: null };
    render(<ArticleDetailPage post={postWithoutReadingTime} />);
    expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
  });

  it("handles zero viewCount", () => {
    const postWithZeroViews = { ...mockPost, viewCount: 0 };
    render(<ArticleDetailPage post={postWithZeroViews} />);
    expect(screen.queryByText(/views/)).not.toBeInTheDocument();
  });
});

describe("getStaticPaths", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns paths for published posts", async () => {
    prisma.post.findMany.mockResolvedValue([
      { topic: "tech", slug: "article-1" },
      { topic: "ai", slug: "article-2" },
    ]);

    const result = await getStaticPaths();

    expect(result.paths).toEqual([
      { params: { topic: "tech", slug: "article-1" } },
      { params: { topic: "ai", slug: "article-2" } },
    ]);
    expect(result.fallback).toBe("blocking");
  });

  it("returns empty paths on error", async () => {
    prisma.post.findMany.mockRejectedValue(new Error("Database error"));

    const result = await getStaticPaths();

    expect(result.paths).toEqual([]);
    expect(result.fallback).toBe("blocking");
  });
});

describe("getStaticProps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns post props for published post", async () => {
    const mockDbPost = {
      ...mockPost,
      status: "Published",
      datePublished: new Date("2024-01-15"),
      _count: { comments: 3, likes: 10 },
    };
    prisma.post.findUnique.mockResolvedValue(mockDbPost);

    const result = await getStaticProps({
      params: { topic: "TECH", slug: "test-article" },
    });

    expect(result.props.post).toBeDefined();
    expect(result.revalidate).toBe(60);
    expect(prisma.post.findUnique).toHaveBeenCalledWith({
      where: { slug: "test-article", topic: "tech" },
      include: {
        _count: {
          select: {
            comments: { where: { approved: true } },
            likes: true,
          },
        },
      },
    });
  });

  it("returns notFound for non-existent post", async () => {
    prisma.post.findUnique.mockResolvedValue(null);

    const result = await getStaticProps({
      params: { topic: "tech", slug: "nonexistent" },
    });

    expect(result.notFound).toBe(true);
  });

  it("returns notFound for non-published post", async () => {
    prisma.post.findUnique.mockResolvedValue({
      ...mockPost,
      status: "Draft",
    });

    const result = await getStaticProps({
      params: { topic: "tech", slug: "test-article" },
    });

    expect(result.notFound).toBe(true);
  });

  it("returns notFound on database error", async () => {
    prisma.post.findUnique.mockRejectedValue(new Error("Database error"));

    const result = await getStaticProps({
      params: { topic: "tech", slug: "test-article" },
    });

    expect(result.notFound).toBe(true);
  });
});

