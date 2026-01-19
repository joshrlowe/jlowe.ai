/**
 * Tests for lib/analytics.js
 *
 * Verifies:
 * - Event tracking function
 * - Parameter validation
 * - SSR safety
 * - All 12 event types
 */

import { track } from "@vercel/analytics";
import {
  trackEvent,
  trackCtaClick,
  trackNewsletterSignup,
  trackSocialShare,
  trackLinkCopy,
  trackArticleLike,
  trackCommentSubmit,
  trackProjectView,
  trackFilterChange,
  trackScrollDepth,
  trackExternalLink,
  trackSearchQuery,
  trackArticleView,
  ANALYTICS_EVENTS,
} from "@/lib/analytics";

// Mock @vercel/analytics
jest.mock("@vercel/analytics");

describe("Analytics Utility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure we're in a browser-like environment
    Object.defineProperty(global, "window", {
      value: {},
      writable: true,
    });
  });

  afterEach(() => {
    // Reset window
    Object.defineProperty(global, "window", {
      value: global.window,
      writable: true,
    });
  });

  describe("ANALYTICS_EVENTS", () => {
    it("should define all 12 event types", () => {
      expect(Object.keys(ANALYTICS_EVENTS)).toHaveLength(12);
      expect(ANALYTICS_EVENTS.CTA_CLICK).toBe("cta_click");
      expect(ANALYTICS_EVENTS.NEWSLETTER_SIGNUP).toBe("newsletter_signup");
      expect(ANALYTICS_EVENTS.SOCIAL_SHARE).toBe("social_share");
      expect(ANALYTICS_EVENTS.LINK_COPY).toBe("link_copy");
      expect(ANALYTICS_EVENTS.ARTICLE_LIKE).toBe("article_like");
      expect(ANALYTICS_EVENTS.COMMENT_SUBMIT).toBe("comment_submit");
      expect(ANALYTICS_EVENTS.PROJECT_VIEW).toBe("project_view");
      expect(ANALYTICS_EVENTS.FILTER_CHANGE).toBe("filter_change");
      expect(ANALYTICS_EVENTS.SCROLL_DEPTH).toBe("scroll_depth");
      expect(ANALYTICS_EVENTS.EXTERNAL_LINK).toBe("external_link");
      expect(ANALYTICS_EVENTS.SEARCH_QUERY).toBe("search_query");
      expect(ANALYTICS_EVENTS.ARTICLE_VIEW).toBe("article_view");
    });
  });

  describe("trackEvent", () => {
    it("should call track with correct event name and properties", () => {
      trackEvent(ANALYTICS_EVENTS.CTA_CLICK, { cta_type: "primary" });

      expect(track).toHaveBeenCalledWith("cta_click", { cta_type: "primary" });
    });

    it("should call track with empty properties when none provided", () => {
      trackEvent(ANALYTICS_EVENTS.NEWSLETTER_SIGNUP);

      expect(track).toHaveBeenCalledWith("newsletter_signup", {});
    });

    it("should not call track for invalid event names", () => {
      trackEvent("invalid_event", {});

      expect(track).not.toHaveBeenCalled();
    });

    it("should be SSR-safe and not call track when window is undefined", () => {
      Object.defineProperty(global, "window", {
        value: undefined,
        writable: true,
      });

      trackEvent(ANALYTICS_EVENTS.CTA_CLICK, {});

      expect(track).not.toHaveBeenCalled();
    });

    it("should handle track errors gracefully", () => {
      track.mockImplementationOnce(() => {
        throw new Error("Track error");
      });

      // Should not throw
      expect(() =>
        trackEvent(ANALYTICS_EVENTS.CTA_CLICK, {})
      ).not.toThrow();
    });
  });

  describe("trackCtaClick", () => {
    it("should track CTA click with type and destination", () => {
      trackCtaClick("primary", "/projects");

      expect(track).toHaveBeenCalledWith("cta_click", {
        cta_type: "primary",
        destination: "/projects",
      });
    });
  });

  describe("trackNewsletterSignup", () => {
    it("should track newsletter signup", () => {
      trackNewsletterSignup();

      expect(track).toHaveBeenCalledWith("newsletter_signup", {});
    });
  });

  describe("trackSocialShare", () => {
    it("should track social share with platform and URL", () => {
      trackSocialShare("twitter", "https://example.com/article");

      expect(track).toHaveBeenCalledWith("social_share", {
        platform: "twitter",
        url: "https://example.com/article",
      });
    });
  });

  describe("trackLinkCopy", () => {
    it("should track link copy with URL", () => {
      trackLinkCopy("https://example.com/article");

      expect(track).toHaveBeenCalledWith("link_copy", {
        url: "https://example.com/article",
      });
    });
  });

  describe("trackArticleLike", () => {
    it("should track article like with ID and title", () => {
      trackArticleLike("article-123", "My Article Title");

      expect(track).toHaveBeenCalledWith("article_like", {
        article_id: "article-123",
        article_title: "My Article Title",
      });
    });
  });

  describe("trackCommentSubmit", () => {
    it("should track comment submit with post ID", () => {
      trackCommentSubmit("post-456");

      expect(track).toHaveBeenCalledWith("comment_submit", {
        post_id: "post-456",
      });
    });
  });

  describe("trackProjectView", () => {
    it("should track project view with ID and title", () => {
      trackProjectView("project-789", "My Project");

      expect(track).toHaveBeenCalledWith("project_view", {
        project_id: "project-789",
        project_title: "My Project",
      });
    });
  });

  describe("trackFilterChange", () => {
    it("should track filter change with type and value", () => {
      trackFilterChange("status", "completed");

      expect(track).toHaveBeenCalledWith("filter_change", {
        filter_type: "status",
        filter_value: "completed",
      });
    });
  });

  describe("trackScrollDepth", () => {
    it("should track scroll depth with percentage", () => {
      trackScrollDepth(50);

      expect(track).toHaveBeenCalledWith("scroll_depth", {
        depth: 50,
      });
    });
  });

  describe("trackExternalLink", () => {
    it("should track external link with platform and URL", () => {
      trackExternalLink("linkedin", "https://linkedin.com/in/user");

      expect(track).toHaveBeenCalledWith("external_link", {
        platform: "linkedin",
        url: "https://linkedin.com/in/user",
      });
    });
  });

  describe("trackSearchQuery", () => {
    it("should track search query with query and result count", () => {
      trackSearchQuery("react", 15);

      expect(track).toHaveBeenCalledWith("search_query", {
        query: "react",
        result_count: 15,
      });
    });
  });

  describe("trackArticleView", () => {
    it("should track article view with ID, title, and topic", () => {
      trackArticleView("article-123", "My Article", "technology");

      expect(track).toHaveBeenCalledWith("article_view", {
        article_id: "article-123",
        article_title: "My Article",
        topic: "technology",
      });
    });
  });
});
