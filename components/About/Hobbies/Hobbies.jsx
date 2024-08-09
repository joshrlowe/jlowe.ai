import { useInView } from "react-intersection-observer";

import styles from "./Hobbies.module.css";

export default function Hobbies({ hobbies }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.35,
  });

  return (
    <>
      <hr />
      <section
        ref={ref}
        className={`${styles.hobbies} ${inView ? styles.fadeIn : ""}`}
      >
        <h2>Hobbies</h2>
        <ul>
          {hobbies.map((hobby, index) => (
            <li key={index}>{hobby}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
