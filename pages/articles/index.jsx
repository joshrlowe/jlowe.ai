import { useState, useMemo } from "react";
import prisma from "../../lib/prisma";
import SEO from "@/components/SEO";
import Link from "next/link";
import Image from "next/image";
import NewsletterSubscription from "@/components/Articles/NewsletterSubscription";
import { Pagination } from "@/components/ui";
import {
  filterAndSortPosts,
  paginate,
  calculateTotalPages,
} from "@/lib/utils/postFilters";
import { formatArticleDate } from "@/lib/utils/dateUtils";
import { POSTS_PER_PAGE, PLAYLISTS_PER_PAGE } from "@/lib/utils/constants";

export default function ArticlesPage({
  recentPosts,
  playlists,
  allTopics,
  allTags,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [sortBy, setSortBy] = useState("datePublished");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [playlistPage, setPlaylistPage] = useState(1);

  const filteredPosts = useMemo(() => {
    return filterAndSortPosts(recentPosts, {
      searchQuery,
      topic: selectedTopic,
      tag: selectedTag,
      sortBy,
      sortOrder,
    });
  }, [recentPosts, searchQuery, selectedTopic, selectedTag, sortBy, sortOrder]);

  const paginatedPosts = useMemo(() => {
    return paginate(filteredPosts, currentPage, POSTS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  const paginatedPlaylists = useMemo(() => {
    return paginate(playlists, playlistPage, PLAYLISTS_PER_PAGE);
  }, [playlists, playlistPage]);

  const totalPages = calculateTotalPages(filteredPosts.length, POSTS_PER_PAGE);
  const totalPlaylistPages = calculateTotalPages(
    playlists.length,
    PLAYLISTS_PER_PAGE,
  );

  return (
    <>
      <SEO
        title="Articles - Josh Lowe"
        description="Read my latest articles on web development, full-stack engineering, and technology insights."
        url="https://jlowe.ai/articles"
      />
      <div className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 w-full">
        <div className="w-full max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--color-primary)] mb-4 font-[family-name:var(--font-oswald)]">
              Articles
            </h1>
            <p
              className="text-lg text-[var(--color-text-secondary)] mx-auto"
              style={{ maxWidth: "80%" }}
            >
              Latest articles, tutorials, and insights on web development and
              technology.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] mb-4"
            />

            <div className="flex flex-wrap gap-4">
              <select
                value={selectedTopic}
                onChange={(e) => {
                  setSelectedTopic(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              >
                <option value="all">All Topics</option>
                {allTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>

              <select
                value={selectedTag}
                onChange={(e) => {
                  setSelectedTag(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              >
                <option value="all">All Tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split("-");
                  setSortBy(sort);
                  setSortOrder(order);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              >
                <option value="datePublished-desc">Newest First</option>
                <option value="datePublished-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="viewCount-desc">Most Views</option>
              </select>
            </div>
          </div>

          {/* Latest Articles */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 font-[family-name:var(--font-oswald)]">
              Latest Articles
            </h2>

            {paginatedPosts.length === 0 ? (
              <p className="text-[var(--color-text-secondary)] text-center py-12">
                No articles found.
              </p>
            ) : (
              <div className="space-y-6">
                {paginatedPosts.map((post) => (
                  <article key={post.id} className="group">
                    <Link
                      href={`/articles/${post.topic}/${post.slug}`}
                      className="flex flex-col sm:flex-row gap-6 p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all duration-300"
                    >
                      {post.coverImage && (
                        <div className="relative w-full sm:w-48 h-32 shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 200px"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                            {post.topic}
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {formatArticleDate(post.datePublished)}
                          </span>
                          {post.readingTime && (
                            <span className="text-xs text-[var(--color-text-muted)]">
                              {post.readingTime} min read
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-[var(--color-text-secondary)] text-sm mb-4 line-clamp-2">
                          {post.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {post.tags?.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 text-xs rounded bg-[var(--color-bg-darker)] text-[var(--color-text-muted)]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="mt-8"
            />
          </section>

          {/* Playlists */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 font-[family-name:var(--font-oswald)]">
              Playlists
            </h2>

            {paginatedPlaylists.length === 0 ? (
              <p className="text-[var(--color-text-secondary)] text-center py-12">
                No playlists available.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedPlaylists.map((playlist) => (
                    <Link
                      key={playlist.id}
                      href={`/articles/playlist/${playlist.slug}`}
                      className="group p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all duration-300"
                    >
                      {playlist.coverImage && (
                        <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden">
                          <Image
                            src={playlist.coverImage}
                            alt={playlist.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 400px"
                          />
                        </div>
                      )}
                      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                        {playlist.title}
                      </h3>
                      {playlist.description && (
                        <p className="text-sm text-[var(--color-text-secondary)] mb-4 line-clamp-2">
                          {playlist.description}
                        </p>
                      )}
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {playlist._count?.playlistPosts || 0} articles
                      </span>
                    </Link>
                  ))}
                </div>

                {/* Playlist Pagination */}
                <Pagination
                  currentPage={playlistPage}
                  totalPages={totalPlaylistPages}
                  onPageChange={setPlaylistPage}
                  className="mt-8"
                />
              </>
            )}
          </section>

          {/* Newsletter */}
          <NewsletterSubscription />
        </div>
      </div>
    </>
  );
}

export async function getStaticProps() {
  try {
    let recentPosts = [];
    let playlists = [];
    let topics = [];
    let tags = [];

    try {
      recentPosts = await prisma.post.findMany({
        where: { status: "Published" },
        orderBy: { datePublished: "desc" },
        take: 100,
        include: {
          _count: {
            select: {
              comments: { where: { approved: true } },
              likes: true,
            },
          },
        },
      });

      playlists = await prisma.playlist.findMany({
        orderBy: [
          { featured: "desc" },
          { order: "asc" },
          { createdAt: "desc" },
        ],
        include: {
          _count: {
            select: { playlistPosts: true },
          },
        },
      });

      const allPosts = await prisma.post.findMany({
        where: { status: "Published" },
        select: { topic: true, tags: true },
      });

      topics = [...new Set(allPosts.map((p) => p.topic))].sort();
      tags = [...new Set(allPosts.flatMap((p) => p.tags || []))].sort();
    } catch (dbError) {
      console.warn(
        "Post model not found - database may need migration:",
        dbError.message,
      );
    }

    return {
      props: {
        recentPosts: JSON.parse(JSON.stringify(recentPosts)),
        playlists: JSON.parse(JSON.stringify(playlists)),
        allTopics: topics,
        allTags: tags,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error in articles getStaticProps:", error);
    return {
      props: {
        recentPosts: [],
        playlists: [],
        allTopics: [],
        allTags: [],
      },
      revalidate: 60,
    };
  }
}
