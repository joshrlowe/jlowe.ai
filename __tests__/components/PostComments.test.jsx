/**
 * Tests for PostComments component
 */
import { render, screen, waitFor } from "@testing-library/react";
import { toast } from "react-toastify";
import PostComments from "../../components/Articles/PostComments";

// Mock react-toastify
jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe("PostComments", () => {
  const postId = "test-post-id";

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  it("should render comment form", () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<PostComments postId={postId} />);

    expect(screen.getByPlaceholderText("Your Name *")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Your Email (optional)"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Write your comment... *"),
    ).toBeInTheDocument();
    expect(screen.getByText("Submit Comment")).toBeInTheDocument();
  });

  it("should fetch and display comments", async () => {
    const mockComments = [
      {
        id: "1",
        authorName: "John Doe",
        content: "Great article!",
        createdAt: new Date().toISOString(),
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockComments,
    });

    render(<PostComments postId={postId} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/comments?postId=${postId}&approved=true`,
      );
    });

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Great article!")).toBeInTheDocument();
  });

  it("should submit comment successfully", async () => {
    const { userEvent } = require("@testing-library/user-event");
    const user = userEvent.setup();

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "1",
          authorName: "Jane",
          content: "New comment",
        }),
      });

    render(<PostComments postId={postId} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Your Name *")).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText("Your Name *"), "Jane");
    await user.type(
      screen.getByPlaceholderText("Write your comment... *"),
      "New comment",
    );
    await user.click(screen.getByText("Submit Comment"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          authorName: "Jane",
          authorEmail: "",
          content: "New comment",
        }),
      });
    });

    expect(toast.success).toHaveBeenCalled();
  });

  it("should show error if submission fails", async () => {
    const { userEvent } = require("@testing-library/user-event");
    const user = userEvent.setup();

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Error message" }),
      });

    render(<PostComments postId={postId} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Your Name *")).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText("Your Name *"), "Jane");
    await user.type(
      screen.getByPlaceholderText("Write your comment... *"),
      "Comment",
    );
    await user.click(screen.getByText("Submit Comment"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("should display no comments message when empty", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<PostComments postId={postId} />);

    await waitFor(() => {
      expect(
        screen.getByText(/No comments yet. Be the first to comment!/),
      ).toBeInTheDocument();
    });
  });
});
