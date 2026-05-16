/**
 * Analytics Utility - Centralized event tracking
 *
 * Wraps @vercel/analytics track() with:
 * - Type-safe event names
 * - Consistent property handling
 * - Development mode logging
 * - SSR-safe checks
 */

import { track } from "@vercel/analytics";

export const ANALYTICS_EVENTS = {
  CTA_CLICK: "cta_click",
  NEWSLETTER_SIGNUP: "newsletter_signup",
  SOCIAL_SHARE: "social_share",
  LINK_COPY: "link_copy",
  ARTICLE_LIKE: "article_like",
  COMMENT_SUBMIT: "comment_submit",
  PROJECT_VIEW: "project_view",
  FILTER_CHANGE: "filter_change",
  SCROLL_DEPTH: "scroll_depth",
  EXTERNAL_LINK: "external_link",
  SEARCH_QUERY: "search_query",
  ARTICLE_VIEW: "article_view",
  READ_DURATION: "read_duration",
} as const;

type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

type EventProperties = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(eventName: string, properties: EventProperties = {}): void {
  if (typeof window === "undefined") {
    return;
  }

  const validEvents: string[] = Object.values(ANALYTICS_EVENTS);
  if (!validEvents.includes(eventName)) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Analytics] Unknown event name: ${eventName}`);
    }
    return;
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${eventName}`, properties);
  }

  try {
    track(eventName as AnalyticsEvent, properties);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Analytics] Error tracking event:", error);
    }
  }
}

export function trackCtaClick(ctaType: string, destination: string): void {
  trackEvent(ANALYTICS_EVENTS.CTA_CLICK, { cta_type: ctaType, destination });
}

export function trackNewsletterSignup(): void {
  trackEvent(ANALYTICS_EVENTS.NEWSLETTER_SIGNUP);
}

export function trackSocialShare(platform: string, url: string): void {
  trackEvent(ANALYTICS_EVENTS.SOCIAL_SHARE, { platform, url });
}

export function trackLinkCopy(url: string): void {
  trackEvent(ANALYTICS_EVENTS.LINK_COPY, { url });
}

export function trackArticleLike(articleId: string, articleTitle: string): void {
  trackEvent(ANALYTICS_EVENTS.ARTICLE_LIKE, {
    article_id: articleId,
    article_title: articleTitle,
  });
}

export function trackCommentSubmit(postId: string): void {
  trackEvent(ANALYTICS_EVENTS.COMMENT_SUBMIT, { post_id: postId });
}

export function trackProjectView(projectId: string, projectTitle: string): void {
  trackEvent(ANALYTICS_EVENTS.PROJECT_VIEW, {
    project_id: projectId,
    project_title: projectTitle,
  });
}

export function trackFilterChange(filterType: string, filterValue: string): void {
  trackEvent(ANALYTICS_EVENTS.FILTER_CHANGE, {
    filter_type: filterType,
    filter_value: filterValue,
  });
}

interface ScrollDepthOptions {
  slug?: string;
  depth?: number;
}

export function trackScrollDepth(options: ScrollDepthOptions | number): void {
  if (typeof options === "object") {
    trackEvent(ANALYTICS_EVENTS.SCROLL_DEPTH, {
      slug: options.slug,
      depth: options.depth,
    });
  } else {
    trackEvent(ANALYTICS_EVENTS.SCROLL_DEPTH, { depth: options });
  }
}

export function trackExternalLink(platform: string, url: string): void {
  trackEvent(ANALYTICS_EVENTS.EXTERNAL_LINK, { platform, url });
}

export function trackSearchQuery(query: string, resultCount: number): void {
  trackEvent(ANALYTICS_EVENTS.SEARCH_QUERY, { query, result_count: resultCount });
}

interface ArticleViewOptions {
  slug?: string;
  topic?: string;
  readingTime?: number;
}

export function trackArticleView(
  options: ArticleViewOptions | string,
  articleTitle?: string,
  topic?: string
): void {
  if (typeof options === "object") {
    trackEvent(ANALYTICS_EVENTS.ARTICLE_VIEW, {
      slug: options.slug,
      topic: options.topic,
      reading_time: options.readingTime,
    });
  } else {
    trackEvent(ANALYTICS_EVENTS.ARTICLE_VIEW, {
      article_id: options,
      article_title: articleTitle,
      topic,
    });
  }
}

interface ReadDurationOptions {
  slug: string;
  durationSeconds: number;
  completed: boolean;
}

export function trackReadDuration({ slug, durationSeconds, completed }: ReadDurationOptions): void {
  trackEvent(ANALYTICS_EVENTS.READ_DURATION, {
    slug,
    duration_seconds: durationSeconds,
    completed,
  });
}
