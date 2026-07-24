/**
 * Animation Utilities
 *
 * Common animation patterns extracted for reuse.
 */

declare const gsap: unknown;

interface FadeInOptions {
  delay?: number;
  duration?: number;
  ease?: string;
}

interface FadeInAnimation {
  from: { opacity: number; y: number };
  to: { opacity: number; y: number; duration: number; ease: string; delay: number };
}

interface ScrollTriggerOptions {
  start?: string;
  toggleActions?: string;
}

interface ScrollTriggerConfig {
  start: string;
  toggleActions: string;
}

/**
 * Creates GSAP fade-in animation configuration
 */
export function createFadeInAnimation({
  delay = 0,
  duration = 0.8,
  ease = "power2.out",
}: FadeInOptions = {}): FadeInAnimation {
  return {
    from: {
      opacity: 0,
      y: 50,
    },
    to: {
      opacity: 1,
      y: 0,
      duration,
      ease,
      delay,
    },
  };
}

/**
 * Creates scroll trigger configuration
 */
export function createScrollTriggerConfig({
  start = "top 85%",
  toggleActions = "play none none none",
}: ScrollTriggerOptions = {}): ScrollTriggerConfig {
  return {
    start,
    toggleActions,
  };
}

/**
 * Safe GSAP animation helper that checks for window/GSAP availability
 */
export function safeAnimation<T extends (...args: unknown[]) => unknown>(
  animationFn: T
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    if (typeof window === "undefined" || typeof gsap === "undefined") {
      return;
    }
    return animationFn(...args) as ReturnType<T>;
  };
}
