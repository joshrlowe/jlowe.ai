/**
 * ScrollProgress Component - SUPERNOVA Theme
 *
 * Displays a progress bar at the top of the page
 * showing how far the user has scrolled
 */

import { useEffect, useState } from "react";

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;

      setProgress(Math.min(100, Math.max(0, scrollPercent)));
      setVisible(scrollTop > 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 h-[3px] z-[9999] pointer-events-none"
      style={{
        width: `${progress}%`,
        background: "linear-gradient(90deg, #E85D04, #FAA307, #F72585)",
        boxShadow: "0 0 10px rgba(232, 93, 4, 0.5)",
        transition: "width 50ms ease-out",
      }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page scroll progress"
    />
  );
}
