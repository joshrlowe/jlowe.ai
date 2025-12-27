import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { requireAuth } from "@/lib/auth.js";
import AdminLayout from "@/components/admin/AdminLayout";
import Link from "next/link";
import { toast } from "react-toastify";

export async function getServerSideProps(context) {
  return requireAuth(context);
}

export default function AdminArticles() {
  const { status } = useSession();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetchPosts();
    }
  }, [status]);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/admin/posts?status=all");
      const data = await response.json();

      if (response.ok) {
        setPosts(data.posts || []);
      } else {
        setError(data.message || "Failed to fetch posts");
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (postId, currentStatus) => {
    const newStatus = currentStatus === "Published" ? "Draft" : "Published";

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Post ${newStatus.toLowerCase()} successfully`);
        fetchPosts();
      } else {
        toast.error(data.message || "Failed to update post status");
      }
    } catch (err) {
      console.error("Error updating post status:", err);
      toast.error("Failed to update post status");
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Post deleted successfully");
        fetchPosts();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to delete post");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error("Failed to delete post");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not published";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (status === "loading" || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Articles Management">
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="hover:text-red-300">
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Articles
        </h2>
        <Link
          href="/admin/articles/new"
          className="px-6 py-2 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          Create New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-text-muted)]">
          <p>No posts found.</p>
          <Link
            href="/admin/articles/new"
            className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
          >
            Create your first post
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-secondary)]">
                  Title
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-secondary)]">
                  Topic
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-secondary)]">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-secondary)]">
                  Published
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-secondary)]">
                  Views
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-secondary)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-darker)]"
                >
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/articles/${post.id}/edit`}
                      className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)] font-medium"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs rounded bg-[var(--color-bg-card)] text-[var(--color-text-muted)]">
                      {post.topic}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        post.status === "Published"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-[var(--color-text-muted)]">
                    {formatDate(post.datePublished)}
                  </td>
                  <td className="py-3 px-4 text-sm text-[var(--color-text-muted)]">
                    {post.viewCount || 0}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/articles/${post.id}/edit`}
                        className="px-3 py-1 text-sm rounded border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleStatusToggle(post.id, post.status)}
                        className={`px-3 py-1 text-sm rounded border transition-colors ${
                          post.status === "Published"
                            ? "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                            : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                        }`}
                      >
                        {post.status === "Published" ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="px-3 py-1 text-sm rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
