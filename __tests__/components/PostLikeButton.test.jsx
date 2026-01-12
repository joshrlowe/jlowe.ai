/**
 * Tests for PostLikeButton component
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PostLikeButton from "../../components/Articles/PostLikeButton";

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

// Mock fetch
global.fetch = jest.fn();

describe("PostLikeButton", () => {
  const defaultProps = {
    postId: "test-post-id",
    initialLikes: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    mockLocalStorage.clear();
    mockLocalStorage.getItem.mockReturnValue("[]");
  });

  it("should render like button with count", () => {
    render(<PostLikeButton {...defaultProps} />);

    expect(screen.getByLabelText("Like this article")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should show liked state when already liked", () => {
    mockLocalStorage.getItem.mockReturnValue('["test-post-id"]');

    render(<PostLikeButton {...defaultProps} />);

    expect(screen.getByLabelText("Already liked")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should handle like action", async () => {
    fetch.mockResolvedValueOnce({ ok: true });

    render(<PostLikeButton {...defaultProps} />);

    const button = screen.getByLabelText("Like this article");
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: "test-post-id" }),
      });
    });

    await waitFor(() => {
      expect(screen.getByText("6")).toBeInTheDocument();
    });
  });

  it("should not allow multiple likes", async () => {
    mockLocalStorage.getItem.mockReturnValue('["test-post-id"]');

    render(<PostLikeButton {...defaultProps} />);

    const button = screen.getByLabelText("Already liked");
    expect(button).toBeDisabled();
  });

  it("should show error if like fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });
    fetch.mockRejectedValueOnce(new Error("Network error"));

    render(<PostLikeButton {...defaultProps} />);

    const button = screen.getByLabelText("Like this article");
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it("should update like count after successful like", async () => {
    fetch.mockResolvedValueOnce({ ok: true });

    render(<PostLikeButton {...defaultProps} />);

    expect(screen.getByText("5")).toBeInTheDocument();

    const button = screen.getByLabelText("Like this article");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("6")).toBeInTheDocument();
    });
  });

  it("should store liked post in localStorage", async () => {
    fetch.mockResolvedValueOnce({ ok: true });

    render(<PostLikeButton {...defaultProps} />);

    const button = screen.getByLabelText("Like this article");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "likedPosts",
        '["test-post-id"]'
      );
    });
  });

  it("should render with default initialLikes of 0", () => {
    render(<PostLikeButton postId="test-post-id" />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
