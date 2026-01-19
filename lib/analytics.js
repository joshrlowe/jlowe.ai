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

// Valid event names for type safety
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
};

/**
 * Track an analytics event
 *
 * @param {string} eventName - The name of the event (use ANALYTICS_EVENTS constants)
 * @param {Object} properties - Optional properties to attach to the event
 */
export function trackEvent(eventName, properties = {}) {
  // SSR safety check
  if (typeof window === "undefined") {
    return;
  }

  // Validate event name
  const validEvents = Object.values(ANALYTICS_EVENTS);
  if (!validEvents.includes(eventName)) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Analytics] Unknown event name: ${eventName}`);
    }
    return;
  }

  // Development mode logging
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${eventName}`, properties);
  }

  // Track the event
  try {
    track(eventName, properties);
  } catch (error) {
    // Silently fail in production, log in development
    if (process.env.NODE_ENV === "development") {
      console.error("[Analytics] Error tracking event:", error);
    }
  }
}

/**
 * Track a CTA button click
 * @param {string} ctaType - The type of CTA (e.g., 'primary', 'secondary')
 * @param {string} destination - The destination URL or action
 */
export function trackCtaClick(ctaType, destination) {
  trackEvent(ANALYTICS_EVENTS.CTA_CLICK, { cta_type: ctaType, destination });
}

/**
 * Track a newsletter signup
 */
export function trackNewsletterSignup() {
  trackEvent(ANALYTICS_EVENTS.NEWSLETTER_SIGNUP);
}

/**
 * Track a social share
 * @param {string} platform - The social platform (twitter, linkedin, facebook)
 * @param {string} url - The shared URL
 */
export function trackSocialShare(platform, url) {
  trackEvent(ANALYTICS_EVENTS.SOCIAL_SHARE, { platform, url });
}

/**
 * Track a link copy action
 * @param {string} url - The copied URL
 */
export function trackLinkCopy(url) {
  trackEvent(ANALYTICS_EVENTS.LINK_COPY, { url });
}

/**
 * Track an article like
 * @param {string} articleId - The article ID
 * @param {string} articleTitle - The article title
 */
export function trackArticleLike(articleId, articleTitle) {
  trackEvent(ANALYTICS_EVENTS.ARTICLE_LIKE, {
    article_id: articleId,
    article_title: articleTitle,
  });
}

/**
 * Track a comment submission
 * @param {string} postId - The post ID
 */
export function trackCommentSubmit(postId) {
  trackEvent(ANALYTICS_EVENTS.COMMENT_SUBMIT, { post_id: postId });
}

/**
 * Track a project view
 * @param {string} projectId - The project ID
 * @param {string} projectTitle - The project title
 */
export function trackProjectView(projectId, projectTitle) {
  trackEvent(ANALYTICS_EVENTS.PROJECT_VIEW, {
    project_id: projectId,
    project_title: projectTitle,
  });
}

/**
 * Track a filter change
 * @param {string} filterType - The type of filter (status, tag, search)
 * @param {string} filterValue - The selected value
 */
export function trackFilterChange(filterType, filterValue) {
  trackEvent(ANALYTICS_EVENTS.FILTER_CHANGE, {
    filter_type: filterType,
    filter_value: filterValue,
  });
}

/**
 * Track scroll depth milestone
 * @param {Object|number} options - Options object or depth for backwards compatibility
 * @param {string} [options.slug] - The article slug
 * @param {number} [options.depth] - The scroll depth percentage (25, 50, 75, 100)
 */
export function trackScrollDepth(options) {
  // Support both object and legacy number format
  if (typeof options === "object") {
    trackEvent(ANALYTICS_EVENTS.SCROLL_DEPTH, {
      slug: options.slug,
      depth: options.depth,
    });
  } else {
    trackEvent(ANALYTICS_EVENTS.SCROLL_DEPTH, { depth: options });
  }
}

/**
 * Track an external link click
 * @param {string} platform - The platform name (e.g., 'linkedin', 'github')
 * @param {string} url - The external URL
 */
export function trackExternalLink(platform, url) {
  trackEvent(ANALYTICS_EVENTS.EXTERNAL_LINK, { platform, url });
}

/**
 * Track a search query
 * @param {string} query - The search query
 * @param {number} resultCount - The number of results
 */
export function trackSearchQuery(query, resultCount) {
  trackEvent(ANALYTICS_EVENTS.SEARCH_QUERY, { query, result_count: resultCount });
}

/**
 * Track an article view
 * @param {Object|string} options - Options object or article ID for backwards compatibility
 * @param {string} [options.slug] - The article slug
 * @param {string} [options.topic] - The article topic/category
 * @param {number} [options.readingTime] - Estimated reading time in minutes
 * @param {string} [articleTitle] - The article title (legacy)
 * @param {string} [topic] - The article topic (legacy)
 */
export function trackArticleView(options, articleTitle, topic) {
  // Support both object and legacy argument formats
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

/**
 * Track article read duration
 * @param {Object} options - Options object
 * @param {string} options.slug - The article slug
 * @param {number} options.durationSeconds - Time spent reading in seconds
 * @param {boolean} options.completed - Whether the article was fully read (reached 100% scroll)
 */
export function trackReadDuration({ slug, durationSeconds, completed }) {
  trackEvent(ANALYTICS_EVENTS.READ_DURATION, {
    slug,
    duration_seconds: durationSeconds,
    completed,
  });
}
