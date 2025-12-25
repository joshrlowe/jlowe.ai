/**
 * Tests for PostLikeButton component
 */
import { render, screen, waitFor } from "@testing-library/react";
import { toast } from "react-toastify";
import PostLikeButton from "../../components/Articles/PostLikeButton";

// Mock react-toastify
jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe("PostLikeButton", () => {
  const defaultProps = {
    topic: "react",
    slug: "test-post",
    initialLikeData: {
      liked: false,
      likeCount: 5,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  it("should render like button with count", () => {
    render(<PostLikeButton {...defaultProps} />);

    expect(screen.getByLabelText("Like this post")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should show liked state when already liked", () => {
    render(
      <PostLikeButton
        {...defaultProps}
        initialLikeData={{ liked: true, likeCount: 6 }}
      />
    );

    expect(screen.getByLabelText("Already liked")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("should handle like action", async () => {
    const { userEvent } = require("@testing-library/user-event");
    const user = userEvent.setup();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ liked: true, likeCount: 6 }),
    });

    const onLikeUpdate = jest.fn();
    render(<PostLikeButton {...defaultProps} onLikeUpdate={onLikeUpdate} />);

    const likeButton = screen.getByLabelText("Like this post");
    await user.click(likeButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/posts/${defaultProps.topic}/${defaultProps.slug}/like`,
        {
          method: "POST",
        }
      );
    });

    expect(onLikeUpdate).toHaveBeenCalledWith({
      liked: true,
      likeCount: 6,
    });
  });

  it("should not allow multiple likes", async () => {
    const { userEvent } = require("@testing-library/user-event");
    const user = userEvent.setup();

    render(
      <PostLikeButton
        {...defaultProps}
        initialLikeData={{ liked: true, likeCount: 6 }}
      />
    );

    const likeButton = screen.getByLabelText("Already liked");
    expect(likeButton).toBeDisabled();
    await user.click(likeButton);

    expect(fetch).not.toHaveBeenCalled();
  });

  it("should show error if like fails", async () => {
    const { userEvent } = require("@testing-library/user-event");
    const user = userEvent.setup();

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Already liked" }),
    });

    render(<PostLikeButton {...defaultProps} />);

    const likeButton = screen.getByLabelText("Like this post");
    await user.click(likeButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("should update like count after successful like", async () => {
    const { userEvent } = require("@testing-library/user-event");
    const user = userEvent.setup();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ liked: true, likeCount: 6 }),
    });

    render(<PostLikeButton {...defaultProps} />);

    const likeButton = screen.getByLabelText("Like this post");
    await user.click(likeButton);

    await waitFor(() => {
      expect(screen.getByText("6")).toBeInTheDocument();
    });
  });
});

