/**
 * Tests for PostComments component
 * 
 * Uses custom test-utils for proper act() warning suppression
 */
import { screen, waitFor, renderWithoutProviders } from "@/test-utils";
import PostComments from "@/components/Articles/PostComments";

// Mock fetch
global.fetch = jest.fn();

describe("PostComments", () => {
  const postId = "test-post-id";

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  it("should render comment form", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    renderWithoutProviders(<PostComments postId={postId} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText("Your email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your comment")).toBeInTheDocument();
    expect(screen.getByText("Submit Comment")).toBeInTheDocument();
  });

  it("should fetch and display comments", async () => {
    const mockComments = [
      {
        id: "1",
        name: "John Doe",
        content: "Great article!",
        createdAt: new Date().toISOString(),
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockComments,
    });

    renderWithoutProviders(<PostComments postId={postId} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/comments?postId=${postId}`,
      );
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    expect(screen.getByText("Great article!")).toBeInTheDocument();
  });

  it("should submit comment successfully", async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "1",
          name: "Jane",
          content: "New comment",
        }),
      });

    const { user } = renderWithoutProviders(<PostComments postId={postId} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText("Your name"), "Jane");
    await user.type(screen.getByPlaceholderText("Your email"), "jane@test.com");
    await user.type(screen.getByPlaceholderText("Your comment"), "New comment");
    await user.click(screen.getByText("Submit Comment"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Jane",
          email: "jane@test.com",
          content: "New comment",
          postId,
        }),
      });
    });

    // Component shows success message, not toast
    await waitFor(() => {
      expect(screen.getByText(/awaiting approval/i)).toBeInTheDocument();
    });
  });

  it("should show error if submission fails", async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Error message" }),
      });

    const { user } = renderWithoutProviders(<PostComments postId={postId} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText("Your name"), "Jane");
    await user.type(screen.getByPlaceholderText("Your email"), "jane@test.com");
    await user.type(screen.getByPlaceholderText("Your comment"), "Comment");
    await user.click(screen.getByText("Submit Comment"));

    // Component shows error message inline, not toast
    await waitFor(() => {
      expect(screen.getByText("Error message")).toBeInTheDocument();
    });
  });

  it("should display no comments message when empty", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    renderWithoutProviders(<PostComments postId={postId} />);

    await waitFor(() => {
      expect(
        screen.getByText(/No comments yet. Be the first to comment!/),
      ).toBeInTheDocument();
    });
  });
});
