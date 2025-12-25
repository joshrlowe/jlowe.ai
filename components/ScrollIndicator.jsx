import { useEffect, useState } from "react";
import { gsap } from "gsap";
import styles from "@/styles/ScrollIndicator.module.css";

export default function ScrollIndicator({ targetId }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isVisible) {
      gsap.to(`.${styles.indicator}`, {
        y: 10,
        duration: 1.5,
        ease: "power2.inOut",
        repeat: -1,
        yoyo: true,
      });
    }
  }, [isVisible]);

  const handleClick = () => {
    if (targetId) {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.scrollIndicator} onClick={handleClick}>
      <div className={styles.indicator}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      <span className={styles.text}>Scroll</span>
    </div>
  );
}

