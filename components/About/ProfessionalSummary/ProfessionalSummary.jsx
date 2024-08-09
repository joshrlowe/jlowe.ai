import { useInView } from "react-intersection-observer";
import styles from "./ProfessionalSummary.module.css";

export default function ProfessionalSummary({ children }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.25,
  });

  return (
    <div
      ref={ref}
      className={`${styles.aboutMe} ${inView ? styles.fadeIn : ""}`}
      dangerouslySetInnerHTML={{ __html: children }}
    />
  );
}
