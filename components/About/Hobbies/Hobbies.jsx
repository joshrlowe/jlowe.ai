import { useInView } from "react-intersection-observer";
import styles from "./Hobbies.module.css";

export default function Hobbies({ hobbies }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <>
      <hr />
      <section
        ref={ref}
        className={`${styles.hobbies} ${inView ? styles.fadeIn : ""}`}
      >
        <h2>Hobbies & Interests</h2>
        <div className={styles.hobbiesGrid}>
          {hobbies.map((hobby, index) => (
            <div
              key={index}
              className={styles.hobbyCard}
              style={{
                animationDelay: inView ? `${index * 0.05}s` : "0s",
              }}
            >
              <div className={styles.hobbyName}>{hobby}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
