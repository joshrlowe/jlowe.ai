import { useState, useEffect, useCallback } from "react";

export default function PostComments({ postId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState({
    name: "",
    email: "",
    content: "",
  });
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/comments?postId=${postId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (_error) {
      // Error logged silently - comments will remain empty
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newComment, postId }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("Your comment has been submitted and is awaiting approval.");
        setNewComment({ name: "", email: "", content: "" });
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to submit comment.");
      }
    } catch (_error) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 font-heading">
        Comments
      </h2>

      {/* Comment Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]"
      >
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Leave a Comment
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Your name"
            value={newComment.name}
            onChange={(e) =>
              setNewComment({ ...newComment, name: e.target.value })
            }
            className="px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            required
          />
          <input
            type="email"
            placeholder="Your email"
            value={newComment.email}
            onChange={(e) =>
              setNewComment({ ...newComment, email: e.target.value })
            }
            className="px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            required
          />
        </div>

        <textarea
          placeholder="Your comment"
          value={newComment.content}
          onChange={(e) =>
            setNewComment({ ...newComment, content: e.target.value })
          }
          rows={4}
          className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] resize-none mb-4"
          required
        />

        <button
          type="submit"
          disabled={status === "loading"}
          className="px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === "loading" ? "Submitting..." : "Submit Comment"}
        </button>

        {message && (
          <p
            className={`mt-4 text-sm ${status === "success" ? "text-green-400" : "text-red-400"}`}
          >
            {message}
          </p>
        )}
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-[var(--color-bg-card)] animate-pulse"
            >
              <div className="h-4 w-32 bg-[var(--color-bg-darker)] rounded mb-2"></div>
              <div className="h-16 bg-[var(--color-bg-darker)] rounded"></div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-[var(--color-text-secondary)] text-center py-8">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[var(--color-text-primary)]">
                  {comment.name}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-[var(--color-text-secondary)]">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
