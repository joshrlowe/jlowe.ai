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

  describe("Comment Form", () => {
    it("should update author name input", async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
      render(<PostComments postId={postId} />);
      
      await waitFor(() => expect(fetch).toHaveBeenCalled());
      
      const nameInput = screen.getByPlaceholderText("Your name");
      fireEvent.change(nameInput, { target: { value: "Test User" } });
      expect(nameInput.value).toBe("Test User");
    });

    it("should update author email input", async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
      render(<PostComments postId={postId} />);
      
      await waitFor(() => expect(fetch).toHaveBeenCalled());
      
      const emailInput = screen.getByPlaceholderText("Your email (optional)");
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      expect(emailInput.value).toBe("test@example.com");
    });

    it("should update comment content input", async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
      render(<PostComments postId={postId} />);
      
      await waitFor(() => expect(fetch).toHaveBeenCalled());
      
      const contentInput = screen.getByPlaceholderText("Your comment");
      fireEvent.change(contentInput, { target: { value: "My test comment" } });
      expect(contentInput.value).toBe("My test comment");
    });

    it("should submit comment successfully", async () => {
      jest.useFakeTimers();
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
      
      render(<PostComments postId={postId} />);
      await waitFor(() => expect(fetch).toHaveBeenCalled());

      const nameInput = screen.getByPlaceholderText("Your name");
      const contentInput = screen.getByPlaceholderText("Your comment");
      const submitButton = screen.getByRole("button", { name: /submit comment/i });

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(contentInput, { target: { value: "Test comment" } });

      // Mock the POST and subsequent GET
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "new-comment" }),
      });
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Comment posted successfully!")).toBeInTheDocument();
      });

      // Clear timer for success message
      jest.advanceTimersByTime(3000);
      jest.useRealTimers();
    });

    it("should show error message on failed submission", async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
      
      render(<PostComments postId={postId} />);
      await waitFor(() => expect(fetch).toHaveBeenCalled());

      const nameInput = screen.getByPlaceholderText("Your name");
      const contentInput = screen.getByPlaceholderText("Your comment");
      const submitButton = screen.getByRole("button", { name: /submit comment/i });

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(contentInput, { target: { value: "Test comment" } });

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Failed to post comment" }),
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Failed to post comment")).toBeInTheDocument();
      });
    });

    it("should handle network error on submission", async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
      
      render(<PostComments postId={postId} />);
      await waitFor(() => expect(fetch).toHaveBeenCalled());

      const nameInput = screen.getByPlaceholderText("Your name");
      const contentInput = screen.getByPlaceholderText("Your comment");
      const submitButton = screen.getByRole("button", { name: /submit comment/i });

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(contentInput, { target: { value: "Test comment" } });

      fetch.mockRejectedValueOnce(new Error("Network error"));

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
      });
    });

    it("should show loading state during submission", async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
      
      render(<PostComments postId={postId} />);
      await waitFor(() => expect(fetch).toHaveBeenCalled());

      const nameInput = screen.getByPlaceholderText("Your name");
      const contentInput = screen.getByPlaceholderText("Your comment");
      const submitButton = screen.getByRole("button", { name: /submit comment/i });

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(contentInput, { target: { value: "Test comment" } });

      fetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Submitting...")).toBeInTheDocument();
      });
    });
  });

  describe("CommentItem", () => {
    const mockComment = {
      id: "1",
      authorName: "John Doe",
      content: "Great article!",
      createdAt: new Date().toISOString(),
      likes: 5,
      dislikes: 2,
      replies: [],
    };

    it("should handle like vote", async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [mockComment] });
      
      render(<PostComments postId={postId} />);
      
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const likeButton = screen.getByText("5").closest("button");
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likes: 6, dislikes: 2, userVote: "like" }),
      });

      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/comments/1/vote",
          expect.objectContaining({ method: "POST" })
        );
      });
    });

    it("should handle dislike vote", async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [mockComment] });
      
      render(<PostComments postId={postId} />);
      
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const dislikeButton = screen.getByText("2").closest("button");
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likes: 5, dislikes: 3, userVote: "dislike" }),
      });

      fireEvent.click(dislikeButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/comments/1/vote",
          expect.objectContaining({ method: "POST" })
        );
      });
    });

    it("should handle vote error gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [mockComment] });
      
      render(<PostComments postId={postId} />);
      
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const likeButton = screen.getByText("5").closest("button");
      
      fetch.mockRejectedValueOnce(new Error("Vote failed"));

      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Error voting:", expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it("should toggle reply form", async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [mockComment] });
      
      render(<PostComments postId={postId} />);
      
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const replyButton = screen.getByText("Reply").closest("button");
      fireEvent.click(replyButton);

      expect(screen.getByPlaceholderText("Write a reply...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /post reply/i })).toBeInTheDocument();

      // Click cancel to hide
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(screen.queryByPlaceholderText("Write a reply...")).not.toBeInTheDocument();
    });

    it("should submit reply successfully", async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [mockComment] });
      
      render(<PostComments postId={postId} />);
      
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Open reply form
      fireEvent.click(screen.getByText("Reply").closest("button"));

      // Get all "Your name" inputs - the second one is the reply form
      const authorInputs = screen.getAllByPlaceholderText("Your name");
      const replyInput = screen.getByPlaceholderText("Write a reply...");
      
      // The reply form input is the second one (index 1)
      fireEvent.change(authorInputs[1], { target: { value: "Reply Author" } });
      fireEvent.change(replyInput, { target: { value: "This is a reply" } });

      // Mock POST and refetch
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: "new-reply" }) });
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [mockComment] });

      fireEvent.click(screen.getByRole("button", { name: /post reply/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/comments",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining("Reply Author"),
          })
        );
      });
    });

    it("should handle reply submission error", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [mockComment] });
      
      render(<PostComments postId={postId} />);
      
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Reply").closest("button"));

      // Get all "Your name" inputs - the second one is the reply form
      const authorInputs = screen.getAllByPlaceholderText("Your name");
      const replyInput = screen.getByPlaceholderText("Write a reply...");
      
      fireEvent.change(authorInputs[1], { target: { value: "Reply Author" } });
      fireEvent.change(replyInput, { target: { value: "This is a reply" } });

      fetch.mockRejectedValueOnce(new Error("Reply failed"));

      fireEvent.click(screen.getByRole("button", { name: /post reply/i }));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Error submitting reply:", expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it("should show and hide replies", async () => {
      const commentWithReplies = {
        ...mockComment,
        replies: [
          {
            id: "2",
            authorName: "Jane Doe",
            content: "Thanks!",
            createdAt: new Date().toISOString(),
            likes: 0,
            dislikes: 0,
            replies: [],
          },
        ],
      };
      
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [commentWithReplies] });
      
      render(<PostComments postId={postId} />);
      
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Replies should be visible by default
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      expect(screen.getByText("Thanks!")).toBeInTheDocument();

      // Hide replies
      const toggleButton = screen.getByText(/Hide 1 reply/i);
      fireEvent.click(toggleButton);

      expect(screen.queryByText("Thanks!")).not.toBeInTheDocument();

      // Show replies again
      fireEvent.click(screen.getByText(/Show 1 reply/i));
      expect(screen.getByText("Thanks!")).toBeInTheDocument();
    });
  });
});
