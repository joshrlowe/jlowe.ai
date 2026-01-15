import { useState, useEffect } from "react";

export default function PostLikeButton({ postId, topic, slug, initialLikes = 0 }) {
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check localStorage first for immediate feedback
    const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "[]");
    if (likedPosts.includes(postId)) {
      setHasLiked(true);
      return;
    }

    // Also check server-side (IP-based) like status
    if (topic && slug) {
      fetch(`/api/posts/${encodeURIComponent(topic)}/${encodeURIComponent(slug)}/like`)
        .then((res) => res.json())
        .then((data) => {
          if (data.liked) {
            setHasLiked(true);
            // Sync localStorage
            const stored = JSON.parse(localStorage.getItem("likedPosts") || "[]");
            if (!stored.includes(postId)) {
              stored.push(postId);
              localStorage.setItem("likedPosts", JSON.stringify(stored));
            }
          }
          if (typeof data.likeCount === "number") {
            setLikes(data.likeCount);
          }
        })
        .catch(() => {
          // Silently fail - localStorage check is sufficient
        });
    }
  }, [postId, topic, slug]);

  const handleLike = async () => {
    if (hasLiked || isLoading || !topic || !slug) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/posts/${encodeURIComponent(topic)}/${encodeURIComponent(slug)}/like`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLikes(data.likeCount || likes + 1);
        setHasLiked(true);

        // Store in localStorage
        const likedPosts = JSON.parse(
          localStorage.getItem("likedPosts") || "[]",
        );
        likedPosts.push(postId);
        localStorage.setItem("likedPosts", JSON.stringify(likedPosts));
      }
    } catch (error) {
      console.error("Error liking post:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={hasLiked || isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
        hasLiked
          ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] cursor-default"
          : "bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      }`}
      aria-label={hasLiked ? "Already liked" : "Like this article"}
    >
      <svg
        className={`w-5 h-5 transition-transform ${hasLiked ? "scale-110" : ""}`}
        fill={hasLiked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span className="font-medium">{likes}</span>
    </button>
  );
}
