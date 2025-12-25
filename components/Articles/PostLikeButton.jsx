import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { buildLikeApiUrl } from "@/lib/utils/likeHelpers.js";
import styles from "./PostLikeButton.module.css";

export default function PostLikeButton({ topic, slug, initialLikeData, onLikeUpdate }) {
  const [liked, setLiked] = useState(initialLikeData?.liked || false);
  const [likeCount, setLikeCount] = useState(initialLikeData?.likeCount || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialLikeData) {
      setLiked(initialLikeData.liked);
      setLikeCount(initialLikeData.likeCount);
    }
  }, [initialLikeData]);

  const handleLike = async () => {
    if (liked || loading) return;

    setLoading(true);

    try {
      const response = await fetch(buildLikeApiUrl(topic, slug), {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setLiked(true);
        setLikeCount(data.likeCount);
        if (onLikeUpdate) {
          onLikeUpdate(data);
        }
      } else {
        toast.error(data.message || "Failed to like post");
      }
    } catch (error) {
      console.error("Like error:", error);
      toast.error("Failed to like post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      className={`${styles.likeButton} ${liked ? styles.liked : ""}`}
      disabled={liked || loading}
      aria-label={liked ? "Already liked" : "Like this post"}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className={styles.likeCount}>{likeCount}</span>
    </button>
  );
}

