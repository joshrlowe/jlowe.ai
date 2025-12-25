import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Container } from "react-bootstrap";
import prisma from "../../../lib/prisma";
import SEO from "@/components/SEO";
import SocialShare from "@/components/Articles/SocialShare";
import PostComments from "@/components/Articles/PostComments";
import PostLikeButton from "@/components/Articles/PostLikeButton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import styles from "@/styles/ArticleDetail.module.css";

// Simple code block component without syntax highlighting for now
const CodeBlock = ({ language, children }) => {
  return (
    <pre className={styles.codeBlock}>
      <code className={language ? `language-${language}` : ""}>{children}</code>
    </pre>
  );
};

export default function ArticleDetailPage({ post: initialPost }) {
  const router = useRouter();
  const [post, setPost] = useState(initialPost);
  const [likeData, setLikeData] = useState(null);

  useEffect(() => {
    // Fetch like status on client side
    const fetchLikeStatus = async () => {
      try {
        const response = await fetch(`/api/posts/${router.query.topic}/${router.query.slug}/like`);
        const data = await response.json();
        setLikeData(data);
      } catch (error) {
        console.error("Error fetching like status:", error);
      }
    };

    if (router.query.topic && router.query.slug) {
      fetchLikeStatus();
    }
  }, [router.query.topic, router.query.slug]);

  if (router.isFallback || !post) {
    return (
      <Container className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </Container>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const articleUrl = typeof window !== "undefined" 
    ? window.location.href 
    : `https://jlowe.ai/articles/${post.topic}/${post.slug}`;

  return (
    <>
      <SEO
        title={post.metaTitle || post.title}
        description={post.metaDescription || post.description}
        image={post.ogImage || post.coverImage}
        url={articleUrl}
      />
      <Container className={styles.container}>
        <article className={styles.article}>
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.meta}>
              <span className={styles.topic}>{post.topic}</span>
              <span className={styles.date}>{formatDate(post.datePublished)}</span>
              {post.readingTime && (
                <span className={styles.readingTime}>{post.readingTime} min read</span>
              )}
              {post.viewCount > 0 && (
                <span className={styles.viewCount}>{post.viewCount} views</span>
              )}
            </div>

            <h1 className={styles.title}>{post.title}</h1>
            {post.description && (
              <p className={styles.description}>{post.description}</p>
            )}

            {post.tags && post.tags.length > 0 && (
              <div className={styles.tags}>
                {post.tags.map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className={styles.authorMeta}>
              <span className={styles.author}>By {post.author}</span>
            </div>
          </header>

          {/* Cover Image */}
          {post.coverImage && (
            <div className={styles.coverImageContainer}>
              <Image
                src={post.coverImage}
                alt={post.title}
                width={1200}
                height={600}
                className={styles.coverImage}
                priority
              />
            </div>
          )}

          {/* Video Embed (for video posts) */}
          {post.postType === "Video" && post.url && (
            <div className={styles.videoContainer}>
              <iframe
                src={post.url}
                className={styles.video}
                allowFullScreen
                frameBorder="0"
              />
            </div>
          )}

          {/* Social Share */}
          <SocialShare
            url={articleUrl}
            title={post.title}
            description={post.description}
          />

          {/* Like Button */}
          <div className={styles.likeSection}>
            <PostLikeButton
              topic={post.topic}
              slug={post.slug}
              initialLikeData={likeData}
              onLikeUpdate={setLikeData}
            />
          </div>

          {/* Content */}
          <div className={styles.content}>
            {post.postType === "Article" && post.content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    if (!inline && match) {
                      return (
                        <CodeBlock language={match[1]} {...props}>
                          {String(children).replace(/\n$/, "")}
                        </CodeBlock>
                      );
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {post.content}
              </ReactMarkdown>
            ) : (
              <p>No content available.</p>
            )}
          </div>

          {/* Social Share (bottom) */}
          <SocialShare
            url={articleUrl}
            title={post.title}
            description={post.description}
          />

          {/* Comments */}
          <PostComments postId={post.id} />
        </article>
      </Container>
    </>
  );
}

export async function getStaticPaths() {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: "Published",
      },
      select: {
        topic: true,
        slug: true,
      },
    });

    const paths = posts.map((post) => ({
      params: {
        topic: post.topic,
        slug: post.slug,
      },
    }));

    return {
      paths,
      fallback: "blocking",
    };
  } catch (error) {
    console.error("Error generating static paths:", error);
    return {
      paths: [],
      fallback: "blocking",
    };
  }
}

export async function getStaticProps({ params }) {
  try {
    const { topic, slug } = params;

    const post = await prisma.post.findUnique({
      where: {
        slug,
        topic: topic.toLowerCase(),
      },
      include: {
        _count: {
          select: {
            comments: {
              where: {
                approved: true,
              },
            },
            likes: true,
          },
        },
      },
    });

    if (!post || post.status !== "Published") {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        post: JSON.parse(JSON.stringify(post)),
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error fetching article:", error);
    return {
      notFound: true,
    };
  }
}
