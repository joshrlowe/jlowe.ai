/**
 * Tests for PostComments component
 */
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PostComments from "@/components/Articles/PostComments";

// Mock fetch
global.fetch = jest.fn();

describe("PostComments", () => {
  const postId = "test-post-id";

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockReset();
  });

  it("should render the component", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<PostComments postId={postId} />);

    // Component should make a fetch call to get comments
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/comments?postId=${postId}`)
      );
    });
  });

  it("should display comments when loaded", async () => {
    const mockComments = [
      {
        id: "1",
        authorName: "John Doe",
        content: "Great article!",
        createdAt: new Date().toISOString(),
        likes: 0,
        dislikes: 0,
        replies: [],
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockComments,
    });

    render(<PostComments postId={postId} />);

    await waitFor(
      () => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
    expect(screen.getByText("Great article!")).toBeInTheDocument();
  });

  it("should handle empty comments", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<PostComments postId={postId} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // Component should render without errors when no comments
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("should handle fetch error gracefully", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));

    render(<PostComments postId={postId} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // Component should still render even with error
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });
});
