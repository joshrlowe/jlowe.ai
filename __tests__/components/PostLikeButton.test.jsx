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
    topic: "test-topic",
    slug: "test-slug",
    initialLikes: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    mockLocalStorage.clear();
    mockLocalStorage.getItem.mockReturnValue("[]");
    
    // Mock the initial GET request for like status
    fetch.mockImplementation((url) => {
      if (url.includes("/like") && !url.includes("POST")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ liked: false, likeCount: 5 }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it("should render like button with count", async () => {
    render(<PostLikeButton {...defaultProps} />);

    expect(screen.getByLabelText("Like this article")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should show liked state when already liked in localStorage", async () => {
    mockLocalStorage.getItem.mockReturnValue('["test-post-id"]');

    render(<PostLikeButton {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Already liked")).toBeInTheDocument();
    });
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should handle like action", async () => {
    // Chain mocks: first GET for status, then POST for like
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ liked: false, likeCount: 5 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ likeCount: 6 }),
      });

    render(<PostLikeButton {...defaultProps} />);

    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    const button = screen.getByLabelText("Like this article");
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/posts/test-topic/test-slug/like",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText("6")).toBeInTheDocument();
    });
  });

  it("should not allow multiple likes", async () => {
    mockLocalStorage.getItem.mockReturnValue('["test-post-id"]');

    render(<PostLikeButton {...defaultProps} />);

    await waitFor(() => {
      const button = screen.getByLabelText("Already liked");
      expect(button).toBeDisabled();
    });
  });

  it("should show error if like fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
    // First call is GET (success), second call is POST (fail)
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ liked: false, likeCount: 5 }),
      })
      .mockRejectedValueOnce(new Error("Network error"));

    render(<PostLikeButton {...defaultProps} />);

    const button = screen.getByLabelText("Like this article");
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it("should update like count after successful like", async () => {
    // Chain mocks: first GET for status, then POST for like
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ liked: false, likeCount: 5 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ likeCount: 6 }),
      });

    render(<PostLikeButton {...defaultProps} />);

    expect(screen.getByText("5")).toBeInTheDocument();

    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    const button = screen.getByLabelText("Like this article");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("6")).toBeInTheDocument();
    });
  });

  it("should store liked post in localStorage", async () => {
    fetch.mockImplementation((url, options) => {
      if (options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ likeCount: 6 }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ liked: false, likeCount: 5 }),
      });
    });

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
    render(<PostLikeButton postId="test-post-id" topic="topic" slug="slug" />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("should sync with server-side like status", async () => {
    // User hasn't liked in localStorage but has liked on server
    mockLocalStorage.getItem.mockReturnValue("[]");
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ liked: true, likeCount: 10 }),
    });

    render(<PostLikeButton {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Already liked")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument();
    });
  });

  it("should not fetch if topic or slug is missing", () => {
    render(<PostLikeButton postId="test-post-id" initialLikes={5} />);

    // Only the initial render, no fetch calls for like status
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});

