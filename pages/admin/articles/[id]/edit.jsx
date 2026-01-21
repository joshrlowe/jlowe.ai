import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { requireAuth } from "@/lib/auth.js";
import AdminLayout from "@/components/admin/AdminLayout";
import { MediaUpload } from "@/components/admin/shared";

export async function getServerSideProps(context) {
  return requireAuth(context);
}

export default function EditArticle() {
  const { status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    postType: "Article",
    url: "",
    content: "",
    tags: [],
    topic: "",
    slug: "",
    author: "Josh Lowe",
    status: "Draft",
    coverImage: "",
    metaTitle: "",
    metaDescription: "",
  });
  const [tagInput, setTagInput] = useState("");

  // Fetch article data on mount
  useEffect(() => {
    if (!id) return;

    const fetchArticle = async () => {
      try {
        const response = await fetch(`/api/admin/posts/${id}`);
        if (!response.ok) {
          throw new Error("Article not found");
        }
        const data = await response.json();
        setFormData({
          title: data.title || "",
          description: data.description || "",
          postType: data.postType || "Article",
          url: data.url || "",
          content: data.content || "",
          tags: data.tags || [],
          topic: data.topic || "",
          slug: data.slug || "",
          author: data.author || "Josh Lowe",
          status: data.status || "Draft",
          coverImage: data.coverImage || "",
          metaTitle: data.metaTitle || "",
          metaDescription: data.metaDescription || "",
        });
      } catch (error) {
        console.error("Error fetching article:", error);
        toast.error("Failed to load article");
        router.push("/admin/articles");
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-generate slug from title
    if (name === "title") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Article updated successfully!");
        
        // Trigger revalidation if published
        if (formData.status === "Published") {
          try {
            await fetch("/api/revalidate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path: "/articles" }),
            });
            await fetch("/api/revalidate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path: `/articles/${formData.slug}` }),
            });
          } catch (e) {
            // Revalidation failure is not critical
            console.warn("Revalidation failed:", e);
          }
        }
        
        router.push("/admin/articles");
      } else {
        toast.error(data.message || "Failed to update article");
      }
    } catch (error) {
      console.error("Error updating article:", error);
      toast.error("Failed to update article");
    } finally {
      setSaving(false);
    }
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
    <AdminLayout title="Edit Article">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Basic Info */}
        <div className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                placeholder="Article title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Slug *
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                placeholder="article-slug"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                placeholder="Short description or excerpt"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Post Type *
                </label>
                <select
                  name="postType"
                  value={formData.postType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="Article">Article</option>
                  <option value="Video">Video</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Topic *
                </label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                  placeholder="e.g., AI, Machine Learning, Web Dev"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Author *
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Content
          </h2>

          {formData.postType === "Video" ? (
            <MediaUpload
              label="Video"
              value={formData.url}
              onChange={(url) => setFormData((prev) => ({ ...prev, url }))}
              accept="video/mp4,video/webm"
              type="video"
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Article Content (Markdown)
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={15}
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-mono text-sm resize-none"
                placeholder="Write your article content in Markdown..."
              />
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Tags
          </h2>

          <div className="flex flex-wrap gap-2 mb-4">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-sm flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag(e)}
              className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              placeholder="Add a tag"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Media & SEO */}
        <div className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Media & SEO
          </h2>

          <div className="space-y-6">
            <MediaUpload
              label="Cover Image"
              value={formData.coverImage}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, coverImage: url }))
              }
              accept="image/jpeg,image/png,image/gif,image/webp"
              type="image"
            />

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Meta Title
              </label>
              <input
                type="text"
                name="metaTitle"
                value={formData.metaTitle}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                placeholder="SEO title (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Meta Description
              </label>
              <textarea
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                placeholder="SEO description (optional)"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/articles")}
            className="px-6 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}

