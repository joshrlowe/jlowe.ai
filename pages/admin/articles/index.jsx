import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Container, Table, Button, Badge, Spinner, Alert } from "react-bootstrap";
import { requireAuth } from "@/lib/auth.js";
import AdminLayout from "@/components/admin/AdminLayout";
import Link from "next/link";
import { toast } from "react-toastify";
import styles from "@/styles/AdminArticles.module.css";

export async function getServerSideProps(context) {
  return requireAuth(context);
}

export default function AdminArticles() {
  const { data: session, status } = useSession();
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
        headers: {
          "Content-Type": "application/json",
        },
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
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

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
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (status === "loading" || loading) {
    return (
      <AdminLayout>
        <div className={styles.loadingContainer}>
          <Spinner animation="border" variant="primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Articles Management">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <div className={styles.header}>
        <h1>Articles</h1>
        <Link href="/admin/articles/new">
          <Button variant="primary">Create New Post</Button>
        </Link>
      </div>

      <Table striped bordered hover className={styles.table}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Topic</th>
            <th>Status</th>
            <th>Published</th>
            <th>Views</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.length === 0 ? (
            <tr>
              <td colSpan={6} className={styles.emptyState}>
                No posts found. <Link href="/admin/articles/new">Create your first post</Link>
              </td>
            </tr>
          ) : (
            posts.map((post) => (
              <tr key={post.id}>
                <td>
                  <Link href={`/admin/articles/${post.id}/edit`} className={styles.postTitle}>
                    {post.title}
                  </Link>
                </td>
                <td>
                  <Badge bg="secondary">{post.topic}</Badge>
                </td>
                <td>
                  <Badge bg={post.status === "Published" ? "success" : "warning"}>
                    {post.status}
                  </Badge>
                </td>
                <td>{formatDate(post.datePublished)}</td>
                <td>{post.viewCount || 0}</td>
                <td>
                  <div className={styles.actions}>
                    <Link href={`/admin/articles/${post.id}/edit`}>
                      <Button variant="outline-primary" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant={post.status === "Published" ? "outline-warning" : "outline-success"}
                      size="sm"
                      onClick={() => handleStatusToggle(post.id, post.status)}
                    >
                      {post.status === "Published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </AdminLayout>
  );
}

