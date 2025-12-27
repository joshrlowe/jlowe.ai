/**
 * Animation Utilities
 *
 * Following Martin Fowler's refactoring principles:
 * - Extract Method: Common animation patterns extracted
 * - Single Responsibility: Each function handles one animation concern
 */

/**
 * Creates GSAP fade-in animation configuration
 *
 * @param {Object} options - Animation options
 * @param {number} options.delay - Delay before animation starts
 * @param {number} options.duration - Animation duration
 * @param {string} options.ease - Easing function
 * @returns {Object} GSAP animation configuration
 */
export function createFadeInAnimation({
  delay = 0,
  duration = 0.8,
  ease = "power2.out",
} = {}) {
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
 *
 * @param {Object} options - Scroll trigger options
 * @param {string} options.start - Start position
 * @param {string} options.toggleActions - Toggle actions string
 * @returns {Object} ScrollTrigger configuration
 */
export function createScrollTriggerConfig({
  start = "top 85%",
  toggleActions = "play none none none",
} = {}) {
  return {
    start,
    toggleActions,
  };
}

/**
 * Safe GSAP animation helper that checks for window/GSAP availability
 *
 * @param {Function} animationFn - Function that performs GSAP animation
 * @returns {Function} Safe animation function
 */
export function safeAnimation(animationFn) {
  return (...args) => {
    if (typeof window === "undefined" || typeof gsap === "undefined") {
      return;
    }
    return animationFn(...args);
  };
}
