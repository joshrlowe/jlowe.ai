import { useEffect, useRef, type RefObject } from "react";
import { useScrollDepth } from "./useScrollDepth";
import { useReadDuration } from "./useReadDuration";
import {
  trackArticleView,
  trackScrollDepth,
  trackReadDuration,
} from "../analytics";

interface UseReadingAnalyticsOptions {
  articleRef?: RefObject<HTMLElement | null>;
  slug?: string;
  topic?: string;
  readingTime?: number;
}

interface UseReadingAnalyticsResult {
  currentDepth: number;
  reachedMilestones: number[];
  hasReachedMilestone: (milestone: number) => boolean;
  durationSeconds: number;
  isActive: boolean;
  formattedDuration: string;
}

export function useReadingAnalytics(
  { articleRef, slug, topic, readingTime }: UseReadingAnalyticsOptions = {},
): UseReadingAnalyticsResult {
  const hasTrackedViewRef = useRef(false);

  useEffect(() => {
    if (slug && topic && !hasTrackedViewRef.current) {
      hasTrackedViewRef.current = true;
      trackArticleView({ slug, topic, readingTime });
    }
  }, [slug, topic, readingTime]);

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
    currentDepth,
    reachedMilestones,
    hasReachedMilestone,
    durationSeconds,
    isActive,
    formattedDuration,
  };
}

export default useReadingAnalytics;
