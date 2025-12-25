import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import styles from "@/styles/WelcomeCTAs.module.css";

export default function WelcomeCTAs() {
  const ctaContainerRef = useRef(null);
  const buttonsRef = useRef([]);

  useEffect(() => {
    if (!ctaContainerRef.current) return;

    // Animate buttons on mount
    buttonsRef.current.forEach((button, index) => {
      if (button) {
        gsap.fromTo(
          button,
          { opacity: 0, y: 20, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "back.out(1.7)",
            delay: 0.3 + index * 0.1,
          }
        );
      }
    });
  }, []);

  return (
    <div ref={ctaContainerRef} className={styles.ctaContainer}>
      <Link
        ref={(el) => (buttonsRef.current[0] = el)}
        href="/projects"
        className={`${styles.ctaButton} ${styles.primary}`}
      >
        View My Work
      </Link>
      <Link
        ref={(el) => (buttonsRef.current[1] = el)}
        href="/contact"
        className={`${styles.ctaButton} ${styles.secondary}`}
      >
        Get In Touch
      </Link>
    </div>
  );
}

