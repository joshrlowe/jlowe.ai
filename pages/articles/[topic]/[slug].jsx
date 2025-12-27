import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import prisma from "../../../lib/prisma";
import SEO from "@/components/SEO";
import SocialShare from "@/components/Articles/SocialShare";
import PostComments from "@/components/Articles/PostComments";
import PostLikeButton from "@/components/Articles/PostLikeButton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

const CodeBlock = ({ language, children }) => {
  return (
    <pre className="bg-[var(--color-bg-darker)] p-4 rounded-lg overflow-x-auto my-4">
      <code
        className={`text-sm font-mono text-[var(--color-text-primary)] ${language ? `language-${language}` : ""}`}
      >
        {children}
      </code>
    </pre>
  );
};

export default function ArticleDetailPage({ post: initialPost }) {
  const router = useRouter();
  const [post] = useState(initialPost);
  const [likeData, setLikeData] = useState(null);

  useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        const response = await fetch(
          `/api/posts/${router.query.topic}/${router.query.slug}/like`,
        );
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
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
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

  const articleUrl = useMemo(() => {
    return `https://jlowe.ai/articles/${post.topic}/${post.slug}`;
  }, [post.topic, post.slug]);

  return (
    <>
      <SEO
        title={post.metaTitle || post.title}
        description={post.metaDescription || post.description}
        image={post.ogImage || post.coverImage}
        url={articleUrl}
      />
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <article>
            {/* Header */}
            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                  {post.topic}
                </span>
                <span className="text-sm text-[var(--color-text-muted)]">
                  {formatDate(post.datePublished)}
                </span>
                {post.readingTime && (
                  <span className="text-sm text-[var(--color-text-muted)]">
                    {post.readingTime} min read
                  </span>
                )}
                {post.viewCount > 0 && (
                  <span className="text-sm text-[var(--color-text-muted)]">
                    {post.viewCount} views
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--color-text-primary)] mb-4 font-[family-name:var(--font-oswald)]">
                {post.title}
              </h1>

              {post.description && (
                <p className="text-xl text-[var(--color-text-secondary)] mb-6">
                  {post.description}
                </p>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs rounded bg-[var(--color-bg-card)] text-[var(--color-text-muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-sm text-[var(--color-text-secondary)]">
                By {post.author}
              </div>
            </header>

            {/* Cover Image */}
            {post.coverImage && (
              <div className="relative w-full h-64 sm:h-80 md:h-96 mb-8 rounded-xl overflow-hidden">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1200px) 100vw, 1200px"
                />
              </div>
            )}

            {/* Video Embed */}
            {post.postType === "Video" && post.url && (
              <div className="relative w-full aspect-video mb-8 rounded-xl overflow-hidden">
                <iframe
                  src={post.url}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  frameBorder="0"
                />
              </div>
            )}

            {/* Social Share & Like */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-8 border-b border-[var(--color-border)]">
              <SocialShare
                url={articleUrl}
                title={post.title}
                description={post.description}
              />
              <PostLikeButton
                postId={post.id}
                initialLikes={post._count?.likes || 0}
              />
            </div>

            {/* Content */}
            <div className="prose prose-invert prose-lg max-w-none mb-12">
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
                        <code
                          className="bg-[var(--color-bg-card)] px-1.5 py-0.5 rounded text-[var(--color-primary)]"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mt-8 mb-4 font-[family-name:var(--font-oswald)]">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mt-8 mb-4 font-[family-name:var(--font-oswald)]">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-bold text-[var(--color-text-primary)] mt-6 mb-3">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-[var(--color-text-secondary)] mb-4 leading-relaxed">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-6 mb-4 text-[var(--color-text-secondary)]">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-6 mb-4 text-[var(--color-text-secondary)]">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li className="mb-2">{children}</li>,
                    a: ({ children, href }) => (
                      <a
                        href={href}
                        className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] underline"
                      >
                        {children}
                      </a>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-[var(--color-primary)] pl-4 my-4 italic text-[var(--color-text-secondary)]">
                        {children}
                      </blockquote>
                    ),
                    img: ({ src, alt }) => (
                      <span className="block my-8">
                        <Image
                          src={src}
                          alt={alt || ""}
                          width={800}
                          height={400}
                          className="rounded-lg"
                        />
                      </span>
                    ),
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              ) : (
                <p className="text-[var(--color-text-secondary)]">
                  No content available.
                </p>
              )}
            </div>

            {/* Social Share (bottom) */}
            <div className="mb-8 pt-8 border-t border-[var(--color-border)]">
              <SocialShare
                url={articleUrl}
                title={post.title}
                description={post.description}
              />
            </div>

            {/* Comments */}
            <PostComments postId={post.id} />
          </article>
        </div>
      </div>
    </>
  );
}

export async function getStaticPaths() {
  try {
    const posts = await prisma.post.findMany({
      where: { status: "Published" },
      select: { topic: true, slug: true },
    });

    const paths = posts.map((post) => ({
      params: { topic: post.topic, slug: post.slug },
    }));

    return { paths, fallback: "blocking" };
  } catch (error) {
    console.error("Error generating static paths:", error);
    return { paths: [], fallback: "blocking" };
  }
}

export async function getStaticProps({ params }) {
  try {
    const { topic, slug } = params;

    const post = await prisma.post.findUnique({
      where: { slug, topic: topic.toLowerCase() },
      include: {
        _count: {
          select: {
            comments: { where: { approved: true } },
            likes: true,
          },
        },
      },
    });

    if (!post || post.status !== "Published") {
      return { notFound: true };
    }

    return {
      props: { post: JSON.parse(JSON.stringify(post)) },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error fetching article:", error);
    return { notFound: true };
  }
}
