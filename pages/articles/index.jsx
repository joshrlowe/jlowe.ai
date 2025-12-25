import { useState, useMemo } from "react";
import { Container, Row, Col, Form } from "react-bootstrap";
import prisma from "../../lib/prisma";
import SEO from "@/components/SEO";
import Link from "next/link";
import Image from "next/image";
import NewsletterSubscription from "@/components/Articles/NewsletterSubscription";
import { filterAndSortPosts, paginate, calculateTotalPages } from "@/lib/utils/postFilters";
import { formatArticleDate } from "@/lib/utils/dateUtils";
import { POSTS_PER_PAGE, PLAYLISTS_PER_PAGE, SORT_OPTIONS } from "@/lib/utils/constants";
import styles from "@/styles/ArticlesPage.module.css";

export default function ArticlesPage({ recentPosts, playlists, allTopics, allTags }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [sortBy, setSortBy] = useState("datePublished");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [playlistPage, setPlaylistPage] = useState(1);

  // Filter and sort posts (Refactored: Extract Method)
  const filteredPosts = useMemo(() => {
    return filterAndSortPosts(recentPosts, {
      searchQuery,
      topic: selectedTopic,
      tag: selectedTag,
      sortBy,
      sortOrder,
    });
  }, [recentPosts, searchQuery, selectedTopic, selectedTag, sortBy, sortOrder]);

  // Paginate posts (Refactored: Extract Method)
  const paginatedPosts = useMemo(() => {
    return paginate(filteredPosts, currentPage, POSTS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  // Paginate playlists (Refactored: Extract Method)
  const paginatedPlaylists = useMemo(() => {
    return paginate(playlists, playlistPage, PLAYLISTS_PER_PAGE);
  }, [playlists, playlistPage]);

  const totalPages = calculateTotalPages(filteredPosts.length, POSTS_PER_PAGE);
  const totalPlaylistPages = calculateTotalPages(playlists.length, PLAYLISTS_PER_PAGE);

  return (
    <>
      <SEO
        title="Articles - Josh Lowe"
        description="Read my latest articles on web development, full-stack engineering, and technology insights."
        url="https://jlowe.ai/articles"
      />
      <Container className={styles.articlesContainer}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Articles</h1>
          <p className={styles.pageDescription}>
            Latest articles, tutorials, and insights on web development and technology.
          </p>
        </div>

        {/* Search and Filters */}
        <div className={styles.filtersSection}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterRow}>
            <Form.Select
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="all">All Topics</option>
              {allTopics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </Form.Select>

            <Form.Select
              value={selectedTag}
              onChange={(e) => {
                setSelectedTag(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="all">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </Form.Select>

            <Form.Select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split("-");
                setSortBy(sort);
                setSortOrder(order);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="datePublished-desc">Newest First</option>
              <option value="datePublished-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="viewCount-desc">Most Views</option>
            </Form.Select>
          </div>
        </div>

        {/* Top 10 Recent Posts */}
        <section className={styles.recentPostsSection}>
          <h2 className={styles.sectionTitle}>Latest Articles</h2>
          <div className={styles.postsList}>
            {paginatedPosts.length === 0 ? (
              <p className={styles.emptyState}>No articles found.</p>
            ) : (
              paginatedPosts.map((post) => (
                <article key={post.id} className={styles.postCard}>
                  <Link href={`/articles/${post.topic}/${post.slug}`} className={styles.postLink}>
                    {post.coverImage && (
                      <div className={styles.postImage}>
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          width={200}
                          height={120}
                          className={styles.coverImage}
                        />
                      </div>
                    )}
                    <div className={styles.postContent}>
                      <div className={styles.postMeta}>
                        <span className={styles.postTopic}>{post.topic}</span>
                        <span className={styles.postDate}>{formatArticleDate(post.datePublished)}</span>
                        {post.readingTime && (
                          <span className={styles.readingTime}>{post.readingTime} min read</span>
                        )}
                      </div>
                      <h3 className={styles.postTitle}>{post.title}</h3>
                      <p className={styles.postDescription}>{post.description}</p>
                      <div className={styles.postTags}>
                        {post.tags?.slice(0, 3).map((tag, index) => (
                          <span key={index} className={styles.tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </article>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={styles.paginationButton}
              >
                Previous
              </button>
              <span className={styles.paginationInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={styles.paginationButton}
              >
                Next
              </button>
            </div>
          )}
        </section>

        {/* Playlists Grid */}
        <section className={styles.playlistsSection}>
          <h2 className={styles.sectionTitle}>Playlists</h2>
          {paginatedPlaylists.length === 0 ? (
            <p className={styles.emptyState}>No playlists available.</p>
          ) : (
            <>
              <Row className="g-4">
                {paginatedPlaylists.map((playlist) => (
                  <Col key={playlist.id} md={6} lg={4}>
                    <Link href={`/articles/playlist/${playlist.slug}`} className={styles.playlistCard}>
                      {playlist.coverImage && (
                        <div className={styles.playlistImage}>
                          <Image
                            src={playlist.coverImage}
                            alt={playlist.title}
                            width={400}
                            height={250}
                            className={styles.playlistCoverImage}
                          />
                        </div>
                      )}
                      <div className={styles.playlistContent}>
                        <h3 className={styles.playlistTitle}>{playlist.title}</h3>
                        {playlist.description && (
                          <p className={styles.playlistDescription}>{playlist.description}</p>
                        )}
                        <span className={styles.playlistCount}>
                          {playlist._count?.playlistPosts || 0} articles
                        </span>
                      </div>
                    </Link>
                  </Col>
                ))}
              </Row>

              {/* Playlist Pagination */}
              {totalPlaylistPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => setPlaylistPage((p) => Math.max(1, p - 1))}
                    disabled={playlistPage === 1}
                    className={styles.paginationButton}
                  >
                    Previous
                  </button>
                  <span className={styles.paginationInfo}>
                    Page {playlistPage} of {totalPlaylistPages}
                  </span>
                  <button
                    onClick={() => setPlaylistPage((p) => Math.min(totalPlaylistPages, p + 1))}
                    disabled={playlistPage === totalPlaylistPages}
                    className={styles.paginationButton}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Newsletter Subscription */}
        <NewsletterSubscription />
      </Container>
    </>
  );
}

export async function getStaticProps() {
  try {
    // Check if Post model exists (handle case where database hasn't been migrated yet)
    // Get top 10 most recent published posts
    let recentPosts = [];
    let playlists = [];
    let topics = [];
    let tags = [];

    try {
      recentPosts = await prisma.post.findMany({
        where: {
          status: "Published",
        },
        orderBy: {
          datePublished: "desc",
        },
        take: 100, // Get more than 10 so filtering/sorting has data to work with
        include: {
          _count: {
            select: {
              comments: { where: { approved: true } },
              likes: true,
            },
          },
        },
      });

      // Get all playlists
      playlists = await prisma.playlist.findMany({
        orderBy: [
          { featured: "desc" },
          { order: "asc" },
          { createdAt: "desc" },
        ],
        include: {
          _count: {
            select: {
              playlistPosts: true,
            },
          },
        },
      });

      // Get all unique topics and tags
      const allPosts = await prisma.post.findMany({
        where: { status: "Published" },
        select: { topic: true, tags: true },
      });

      topics = [...new Set(allPosts.map((p) => p.topic))].sort();
      tags = [...new Set(allPosts.flatMap((p) => p.tags || []))].sort();
    } catch (dbError) {
      // If Post model doesn't exist, return empty arrays
      // This handles the case where the database hasn't been migrated yet
      console.warn("Post model not found - database may need migration:", dbError.message);
    }

    return {
      props: {
        recentPosts: JSON.parse(JSON.stringify(recentPosts)),
        playlists: JSON.parse(JSON.stringify(playlists)),
        allTopics: topics,
        allTags: tags,
      },
      revalidate: 60, // ISR: revalidate every 60 seconds
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

