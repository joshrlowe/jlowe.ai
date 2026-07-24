import { useState, useEffect, useRef, useCallback, type RefObject } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const DEFAULT_MILESTONES = [25, 50, 75, 100];

interface UseScrollDepthOptions {
  articleRef?: RefObject<HTMLElement | null>;
  milestones?: number[];
  onMilestone?: (milestone: number) => void;
}

interface UseScrollDepthResult {
  currentDepth: number;
  reachedMilestones: number[];
  hasReachedMilestone: (milestone: number) => boolean;
}

export function useScrollDepth({
  articleRef,
  milestones = DEFAULT_MILESTONES,
  onMilestone,
}: UseScrollDepthOptions = {}): UseScrollDepthResult {
  const [currentDepth, setCurrentDepth] = useState(0);
  const [reachedMilestones, setReachedMilestones] = useState<Set<number>>(new Set());
  const sentinelsRef = useRef<HTMLDivElement[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleMilestoneReached = useCallback(
    (milestone: number) => {
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

    const originalPosition = article.style.position;
    if (!originalPosition || originalPosition === "static") {
      article.style.position = "relative";
    }

    sentinels.forEach((sentinel) => article.appendChild(sentinel));
    sentinelsRef.current = sentinels;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const attr = entry.target.getAttribute("data-scroll-milestone");
            const milestone = attr ? parseInt(attr, 10) : NaN;
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

    sentinels.forEach((sentinel) => observer.observe(sentinel));

    return () => {
      observer.disconnect();
      sentinels.forEach((sentinel) => {
        if (sentinel.parentNode) {
          sentinel.parentNode.removeChild(sentinel);
        }
      });

      if (!originalPosition || originalPosition === "static") {
        article.style.position = originalPosition || "";
      }
    };
  }, [articleRef, milestones, handleMilestoneReached, prefersReducedMotion]);

  return {
    currentDepth,
    reachedMilestones: Array.from(reachedMilestones),
    hasReachedMilestone: (milestone: number) => reachedMilestones.has(milestone),
  };
}

export default useScrollDepth;
