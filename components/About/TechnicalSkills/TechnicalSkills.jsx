import { Fragment } from "react";
import { useInView } from "react-intersection-observer";
import styles from "./TechnicalSkills.module.css";

export default function TechnicalSkills({ skills }) {
  const categorizedSkills = {
    "Programming Languages": [],
    "Frontend Development": [],
    "Backend Development": [],
    "Full Stack Development": [],
    Databases: [],
    "Version Control": [],
    DevOps: [],
    "Additional Tools": [],
  };

  skills.forEach((skill) => {
    if (categorizedSkills[skill.category]) {
      categorizedSkills[skill.category].push(skill.skillName);
    }
  });

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.25,
  });

  return (
    <>
      <hr />
      <section
        ref={ref}
        className={`${styles.technicalSkills} ${inView ? styles.fadeIn : ""}`}
      >
        <h2>Technical Skills</h2>
        <div className={styles.skillsGrid}>
          {Object.keys(categorizedSkills).map((category, item) => (
            <div key={item} className={styles.skillsItem}>
              <h3>{category}</h3>
              <div className={styles.skillsList}>
                {categorizedSkills[category].map((skillName, skillIndex) => (
                  <span key={skillIndex}>{skillName}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
