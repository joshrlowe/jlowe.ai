/**
 * New Article Page
 *
 * Protected page for creating new articles.
 * Requires authentication via session check.
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import SEO from "@/components/SEO";
import slugify from "slugify";

// Default topics for articles
const TOPIC_OPTIONS = [
  "javascript",
  "react",
  "nextjs",
  "nodejs",
  "typescript",
  "python",
  "devops",
  "database",
  "security",
  "career",
  "tutorial",
  "other",
];

export default function NewArticlePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    topic: "javascript",
    tags: "",
    coverImage: "",
    metaTitle: "",
    metaDescription: "",
    status: "Draft",
  });

  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Auto-generate slug from title
  useEffect(() => {
    if (autoSlug && formData.title) {
      const generatedSlug = slugify(formData.title, {
        lower: true,
        strict: true,
        trim: true,
      });
      setSlug(generatedSlug);
    }
  }, [formData.title, autoSlug]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login?callbackUrl=/articles/new");
    }
  }, [status, router]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSlugChange = useCallback((e) => {
    setAutoSlug(false);
    setSlug(
      slugify(e.target.value, {
        lower: true,
        strict: true,
        trim: true,
      })
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validate required fields
    if (!formData.title.trim()) {
      setError("Title is required");
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError("Description is required");
      setLoading(false);
      return;
    }

    if (!slug.trim()) {
      setError("Slug is required");
      setLoading(false);
      return;
    }

    try {
      // Parse tags from comma-separated string
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          content: formData.content,
          postType: "Article",
          topic: formData.topic,
          slug: slug,
          author: session?.user?.email || "Admin",
          tags: tags,
          status: formData.status,
          coverImage: formData.coverImage || null,
          metaTitle: formData.metaTitle || null,
          metaDescription: formData.metaDescription || null,
          datePublished: formData.status === "Published" ? new Date().toISOString() : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create article");
      }

      setSuccess("Article created successfully!");

      // Redirect to the article after creation
      setTimeout(() => {
        if (formData.status === "Published") {
          router.push(`/articles/${data.topic}/${data.slug}`);
        } else {
          router.push("/admin/articles");
        }
      }, 1500);
    } catch (err) {
      console.error("Error creating article:", err);
      setError(err.message || "Failed to create article");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[var(--color-bg-dark)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Unauthenticated - show message while redirecting
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[var(--color-bg-dark)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--color-text-secondary)] mb-4">
            Please log in to create articles.
          </p>
          <Link
            href="/admin/login"
            className="text-[var(--color-primary)] hover:underline"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const inputClasses =
    "w-full px-4 py-3 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:opacity-50 transition-all";

  const labelClasses =
    "block text-sm font-medium text-[var(--color-text-primary)] mb-2";

  return (
    <>
      <SEO
        title="Create New Article - Josh Lowe"
        description="Create a new article"
        noIndex={true}
      />

      <div className="min-h-screen bg-[var(--color-bg-dark)] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-oswald)]">
              Create New Article
            </h1>
            <Link
              href="/articles"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            >
              ← Back to Articles
            </Link>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                className="hover:text-red-300"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[var(--color-bg-card)] rounded-xl p-6 border border-[var(--color-border)]">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
                Basic Information
              </h2>

              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label htmlFor="title" className={labelClasses}>
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter article title"
                    className={inputClasses}
                    disabled={loading}
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <label htmlFor="slug" className={labelClasses}>
                    Slug <span className="text-red-400">*</span>
                    <span className="text-xs text-[var(--color-text-muted)] ml-2">
                      (auto-generated from title)
                    </span>
                  </label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={slug}
                    onChange={handleSlugChange}
                    placeholder="article-slug"
                    className={inputClasses}
                    disabled={loading}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className={labelClasses}>
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of the article"
                    rows={3}
                    className={inputClasses}
                    disabled={loading}
                    required
                  />
                </div>

                {/* Topic */}
                <div>
                  <label htmlFor="topic" className={labelClasses}>
                    Topic <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="topic"
                    name="topic"
                    value={formData.topic}
                    onChange={handleInputChange}
                    className={inputClasses}
                    disabled={loading}
                  >
                    {TOPIC_OPTIONS.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic.charAt(0).toUpperCase() + topic.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="tags" className={labelClasses}>
                    Tags
                    <span className="text-xs text-[var(--color-text-muted)] ml-2">
                      (comma-separated)
                    </span>
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="react, hooks, tutorial"
                    className={inputClasses}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="bg-[var(--color-bg-card)] rounded-xl p-6 border border-[var(--color-border)]">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
                Content
              </h2>

              <div>
                <label htmlFor="content" className={labelClasses}>
                  Article Content (Markdown)
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Write your article content in Markdown..."
                  rows={15}
                  className={`${inputClasses} font-mono text-sm`}
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  Supports Markdown formatting: headings, bold, italic, code
                  blocks, links, etc.
                </p>
              </div>
            </div>

            {/* SEO & Media Section */}
            <div className="bg-[var(--color-bg-card)] rounded-xl p-6 border border-[var(--color-border)]">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
                SEO & Media
              </h2>

              <div className="space-y-5">
                {/* Cover Image */}
                <div>
                  <label htmlFor="coverImage" className={labelClasses}>
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    id="coverImage"
                    name="coverImage"
                    value={formData.coverImage}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className={inputClasses}
                    disabled={loading}
                  />
                </div>

                {/* Meta Title */}
                <div>
                  <label htmlFor="metaTitle" className={labelClasses}>
                    Meta Title
                  </label>
                  <input
                    type="text"
                    id="metaTitle"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    placeholder="Custom meta title (optional)"
                    className={inputClasses}
                    disabled={loading}
                  />
                </div>

                {/* Meta Description */}
                <div>
                  <label htmlFor="metaDescription" className={labelClasses}>
                    Meta Description
                  </label>
                  <textarea
                    id="metaDescription"
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    placeholder="Custom meta description for SEO (optional)"
                    rows={2}
                    className={inputClasses}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Publish Settings */}
            <div className="bg-[var(--color-bg-card)] rounded-xl p-6 border border-[var(--color-border)]">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
                Publish Settings
              </h2>

              <div>
                <label htmlFor="status" className={labelClasses}>
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={inputClasses}
                  disabled={loading}
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 justify-end">
              <Link
                href="/articles"
                className="px-6 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] font-semibold hover:bg-[var(--color-bg-card)] transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Creating..." : "Create Article"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

