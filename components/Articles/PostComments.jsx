import { useState, useEffect, useCallback } from "react";
import { trackCommentSubmit } from "@/lib/analytics";

// Single comment component with likes, dislikes, and reply functionality
function CommentItem({ comment, postId, onReplySubmit, depth = 0 }) {
  const [likes, setLikes] = useState(comment.likes || 0);
  const [dislikes, setDislikes] = useState(comment.dislikes || 0);
  const [userVote, setUserVote] = useState(comment.userVote || null);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const handleVote = async (voteType) => {
    try {
      const response = await fetch(`/api/comments/${comment.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType }),
      });

      if (response.ok) {
        const data = await response.json();
        setLikes(data.likes);
        setDislikes(data.dislikes);
        setUserVote(data.userVote);
      }
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyAuthor.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          authorName: replyAuthor,
          content: replyContent,
          parentId: comment.id,
        }),
      });

      if (response.ok) {
        setReplyContent("");
        setReplyAuthor("");
        setIsReplying(false);
        onReplySubmit();
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const dateOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    const timeOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    return `${date.toLocaleDateString("en-US", dateOptions)} at ${date.toLocaleTimeString("en-US", timeOptions)}`;
  };

  const maxDepth = 3; // Limit nesting depth
  const replies = comment.replies || [];

  return (
    <div className={`${depth > 0 ? "ml-6 pl-4 border-l-2 border-[var(--color-border)]" : ""}`}>
      <div className="p-4 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)]">
        {/* Comment Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-[var(--color-text-primary)]">
            {comment.authorName}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {formatDate(comment.createdAt)}
          </span>
        </div>

        {/* Comment Content */}
        <p className="text-[var(--color-text-secondary)] mb-3">
          {comment.content}
        </p>

        {/* Actions: Like, Dislike, Reply */}
        <div className="flex items-center gap-4 text-sm">
          {/* Like Button */}
          <button
            onClick={() => handleVote("like")}
            className={`flex items-center gap-1 transition-colors ${
              userVote === "like"
                ? "text-green-400"
                : "text-[var(--color-text-muted)] hover:text-green-400"
            }`}
          >
            <svg className="w-4 h-4" fill={userVote === "like" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span>{likes}</span>
          </button>

          {/* Dislike Button */}
          <button
            onClick={() => handleVote("dislike")}
            className={`flex items-center gap-1 transition-colors ${
              userVote === "dislike"
                ? "text-red-400"
                : "text-[var(--color-text-muted)] hover:text-red-400"
            }`}
          >
            <svg className="w-4 h-4" fill={userVote === "dislike" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
            <span>{dislikes}</span>
          </button>

          {/* Reply Button */}
          {depth < maxDepth && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>Reply</span>
            </button>
          )}
        </div>

        {/* Reply Form */}
        {isReplying && (
          <form onSubmit={handleReplySubmit} className="mt-4 space-y-3">
            <input
              type="text"
              placeholder="Your name"
              value={replyAuthor}
              onChange={(e) => setReplyAuthor(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] text-sm"
              required
            />
            <textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] resize-none text-sm"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Posting..." : "Post Reply"}
              </button>
              <button
                type="button"
                onClick={() => setIsReplying(false)}
                className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm hover:text-[var(--color-text-primary)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-sm text-[var(--color-primary)] hover:underline mb-2 flex items-center gap-1"
          >
            <svg className={`w-4 h-4 transition-transform ${showReplies ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {showReplies ? "Hide" : "Show"} {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </button>
          {showReplies && (
            <div className="space-y-3">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  onReplySubmit={onReplySubmit}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PostComments({ postId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState({
    authorName: "",
    authorEmail: "",
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
        setMessage("Comment posted successfully!");
        setNewComment({ authorName: "", authorEmail: "", content: "" });
        
        // Track the comment submission
        trackCommentSubmit(postId);
        
        // Refetch comments to show the new one
        fetchComments();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 3000);
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to submit comment.");
      }
    } catch (_error) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
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
            value={newComment.authorName}
            onChange={(e) =>
              setNewComment({ ...newComment, authorName: e.target.value })
            }
            className="px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            required
          />
          <input
            type="email"
            placeholder="Your email (optional)"
            value={newComment.authorEmail}
            onChange={(e) =>
              setNewComment({ ...newComment, authorEmail: e.target.value })
            }
            className="px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
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
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onReplySubmit={fetchComments}
            />
          ))}
        </div>
      )}
    </div>
  );
}
