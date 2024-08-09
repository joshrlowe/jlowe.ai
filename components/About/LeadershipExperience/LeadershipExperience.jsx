import { useInView } from "react-intersection-observer";

import styles from "./LeadershipExperience.module.css";

export default function LeadershipExperience({ experience }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <>
      <hr />
      <section
        ref={ref}
        className={`${styles.leadershipExperience} ${inView ? styles.fadeIn : ""}`}
      >
        <h2>Leadership Experience</h2>
        {experience.map((experience, index) => (
          <div key={index}>
            <h3>
              {experience.role} at {experience.organization}
            </h3>
            <p>
              {new Date(experience.startDate).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}{" "}
              -{" "}
              {new Date(experience.endDate).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
            <ul>
              {experience.achievements.map((achievement, achIndex) => (
                <li key={achIndex}>{achievement}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </>
  );
}
