/**
 * useReadingAnalytics Hook
 *
 * Composes useScrollDepth and useReadDuration for article analytics.
 * Single integration point for article pages.
 * Fires article_view on mount.
 *
 * @param {Object} options - Hook options
 * @param {React.RefObject} options.articleRef - Ref to the article container element
 * @param {string} options.slug - Article slug
 * @param {string} options.topic - Article topic
 * @param {number} options.readingTime - Estimated reading time in minutes
 * @returns {Object} Combined analytics state
 */

import { useEffect, useRef } from "react";
import { useScrollDepth } from "./useScrollDepth";
import { useReadDuration } from "./useReadDuration";
import {
  trackArticleView,
  trackScrollDepth,
  trackReadDuration,
} from "../analytics";

export function useReadingAnalytics({
  articleRef,
  slug,
  topic,
  readingTime,
} = {}) {
  const hasTrackedViewRef = useRef(false);

  // Track article view on mount
  useEffect(() => {
    if (slug && topic && !hasTrackedViewRef.current) {
      hasTrackedViewRef.current = true;
      trackArticleView({ slug, topic, readingTime });
    }
  }, [slug, topic, readingTime]);

  // Track scroll depth
  const { currentDepth, reachedMilestones, hasReachedMilestone } =
    useScrollDepth({
      articleRef,
      milestones: [25, 50, 75, 100],
      onMilestone: (depth) => {
        if (slug) {
          trackScrollDepth({ slug, depth });
        }
      },
    });

  // Track read duration
  const { durationSeconds, isActive, formattedDuration } = useReadDuration({
    slug,
    onUnmount: ({ durationSeconds: duration }) => {
      if (slug && duration > 0) {
        trackReadDuration({
          slug,
          durationSeconds: duration,
          completed: hasReachedMilestone(100),
        });
      }
    },
  });

  return {
    // Scroll depth state
    currentDepth,
    reachedMilestones,
    hasReachedMilestone,

    // Duration state
    durationSeconds,
    isActive,
    formattedDuration,
  };
}

export default useReadingAnalytics;

