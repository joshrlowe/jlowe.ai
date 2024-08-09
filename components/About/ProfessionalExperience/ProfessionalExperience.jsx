import { useInView } from "react-intersection-observer";
import styles from "./ProfessionalExperience.module.css";

export default function ProfessionalExperience({ experience }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  return (
    <>
      <hr />
      <section
        ref={ref}
        className={`${styles.professionalExperience} ${inView ? styles.fadeIn : ""}`}
      >
        <h2>Professional Experience</h2>
        {experience.map((experience, index) => (
          <div key={index}>
            <h3>
              {experience.role} at {experience.company}
            </h3>
            <p>{experience.description}</p>
          </div>
        ))}
      </section>
    </>
  );
}
