import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import styles from "@/styles/AnimatedBackground.module.css";

export default function AnimatedBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const blobs = containerRef.current.querySelectorAll(`.${styles.blob}`);
    
    // Animate blobs with GSAP
    blobs.forEach((blob, index) => {
      const duration = 20 + index * 5; // Vary durations
      const xMovement = (index % 2 === 0 ? 1 : -1) * (50 + index * 20);
      const yMovement = (index % 3 === 0 ? 1 : -1) * (30 + index * 15);

      gsap.to(blob, {
        x: xMovement,
        y: yMovement,
        duration,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      // Also add rotation
      gsap.to(blob, {
        rotation: 360,
        duration: duration * 2,
        ease: "none",
        repeat: -1,
      });
    });

    return () => {
      // Cleanup animations on unmount
      gsap.killTweensOf(blobs);
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.animatedBackground}>
      <div className={`${styles.blob} ${styles.blob1}`}></div>
      <div className={`${styles.blob} ${styles.blob2}`}></div>
      <div className={`${styles.blob} ${styles.blob3}`}></div>
    </div>
  );
}

