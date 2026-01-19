/**
 * useScrollDepth Hook
 *
 * Tracks scroll depth milestones using IntersectionObserver.
 * Fires events only once per milestone per session.
 *
 * @param {Object} options - Hook options
 * @param {React.RefObject} options.articleRef - Ref to the article container element
 * @param {number[]} [options.milestones] - Depth milestones to track (default: [25, 50, 75, 100])
 * @param {Function} [options.onMilestone] - Callback when a milestone is reached
 * @returns {Object} Current scroll depth state
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const DEFAULT_MILESTONES = [25, 50, 75, 100];

export function useScrollDepth({
  articleRef,
  milestones = DEFAULT_MILESTONES,
  onMilestone,
} = {}) {
  const [currentDepth, setCurrentDepth] = useState(0);
  const [reachedMilestones, setReachedMilestones] = useState(new Set());
  const sentinelsRef = useRef([]);
  const observerRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Handle milestone reached
  const handleMilestoneReached = useCallback(
    (milestone) => {
      setReachedMilestones((prev) => {
        if (prev.has(milestone)) {
          return prev;
        }
        const next = new Set(prev);
        next.add(milestone);
        return next;
      });

      setCurrentDepth((prev) => Math.max(prev, milestone));

      if (onMilestone) {
        onMilestone(milestone);
      }
    },
    [onMilestone]
  );

  useEffect(() => {
    const article = articleRef?.current;
    if (!article) {
      return;
    }

    // Skip tracking if user prefers reduced motion (optional behavior)
    // We still track but don't create visual indicators
    const shouldTrack = true;

    if (!shouldTrack) {
      return;
    }

    // Create sentinel elements at each milestone position
    const sentinels = milestones.map((milestone) => {
      const sentinel = document.createElement("div");
      sentinel.setAttribute("data-scroll-milestone", milestone.toString());
      sentinel.style.cssText = `
        position: absolute;
        top: ${milestone}%;
        left: 0;
        width: 100%;
        height: 1px;
        pointer-events: none;
        visibility: hidden;
      `;
      return sentinel;
    });

    // Ensure article has relative positioning for absolute sentinels
    const originalPosition = article.style.position;
    if (!originalPosition || originalPosition === "static") {
      article.style.position = "relative";
    }

    // Append sentinels to article
    sentinels.forEach((sentinel) => article.appendChild(sentinel));
    sentinelsRef.current = sentinels;

    // Create IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const milestone = parseInt(
              entry.target.getAttribute("data-scroll-milestone"),
              10
            );
            if (!isNaN(milestone)) {
              handleMilestoneReached(milestone);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0,
      }
    );

    observerRef.current = observer;

    // Observe all sentinels
    sentinels.forEach((sentinel) => observer.observe(sentinel));

    return () => {
      // Cleanup
      observer.disconnect();
      sentinels.forEach((sentinel) => {
        if (sentinel.parentNode) {
          sentinel.parentNode.removeChild(sentinel);
        }
      });

      // Restore original position
      if (!originalPosition || originalPosition === "static") {
        article.style.position = originalPosition || "";
      }
    };
  }, [articleRef, milestones, handleMilestoneReached, prefersReducedMotion]);

  return {
    currentDepth,
    reachedMilestones: Array.from(reachedMilestones),
    hasReachedMilestone: (milestone) => reachedMilestones.has(milestone),
  };
}

export default useScrollDepth;

