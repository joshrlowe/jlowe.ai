import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { formatCommentDate } from "@/lib/utils/commentHelpers.js";
import styles from "./PostComments.module.css";

export default function PostComments({ postId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    authorName: "",
    authorEmail: "",
    content: "",
  });

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?postId=${postId}&approved=true`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.authorName || !formData.content) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Comment submitted! It will be reviewed before being published.");
        setFormData({
          authorName: "",
          authorEmail: "",
          content: "",
        });
        // Refresh comments after a short delay
        setTimeout(() => {
          fetchComments();
        }, 1000);
      } else {
        toast.error(data.message || "Failed to submit comment");
      }
    } catch (error) {
      console.error("Comment submission error:", error);
      toast.error("Failed to submit comment");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <section className={styles.commentsSection}>
      <h2 className={styles.commentsTitle}>
        Comments ({comments.length})
      </h2>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className={styles.commentForm}>
        <div className={styles.formRow}>
          <input
            type="text"
            placeholder="Your Name *"
            value={formData.authorName}
            onChange={(e) =>
              setFormData({ ...formData, authorName: e.target.value })
            }
            className={styles.formInput}
            required
            disabled={submitting}
          />
          <input
            type="email"
            placeholder="Your Email (optional)"
            value={formData.authorEmail}
            onChange={(e) =>
              setFormData({ ...formData, authorEmail: e.target.value })
            }
            className={styles.formInput}
            disabled={submitting}
          />
        </div>
        <textarea
          placeholder="Write your comment... *"
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          className={styles.formTextarea}
          rows={4}
          required
          disabled={submitting}
        />
        <button
          type="submit"
          className={styles.submitButton}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Comment"}
        </button>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className={styles.loading}>Loading comments...</div>
      ) : comments.length === 0 ? (
        <p className={styles.noComments}>No comments yet. Be the first to comment!</p>
      ) : (
        <div className={styles.commentsList}>
          {comments.map((comment) => (
            <div key={comment.id} className={styles.comment}>
              <div className={styles.commentHeader}>
                <span className={styles.commentAuthor}>{comment.authorName}</span>
                <span className={styles.commentDate}>
                  {formatCommentDate(comment.createdAt)}
                </span>
              </div>
              <div className={styles.commentContent}>{comment.content}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

