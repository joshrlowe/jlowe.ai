import { useInView } from "react-intersection-observer";

import styles from "./Education.module.css";

export default function ProfessionalSummary({ education }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.25,
  });

  return (
    <>
      <hr />
      <section
        ref={ref}
        className={`${styles.education} ${inView ? styles.fadeIn : ""}`}
      >
        <h2>Education</h2>

        <div className={styles.educationGrid}>
          {education.map((education, index) => {
            const sortedCoursework = education.relevantCoursework.sort();
            return (
              <div key={index}>
                <h3>{education.institution}</h3>
                <p className={styles.degree}>
                  {education.degree} in {education.fieldOfStudy}
                </p>
                <p className={styles.date}>
                  {new Date(education.startDate).toLocaleDateString()} -{" "}
                  {new Date(education.endDate).toLocaleDateString()}
                </p>
                <p className={styles.courseworkTitle}>Relevant Coursework:</p>
                <ul className={styles.courseworkFlex}>
                  {sortedCoursework.map((course, index) => (
                    <li key={index} className={styles.courseworkItem}>
                      {course}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
