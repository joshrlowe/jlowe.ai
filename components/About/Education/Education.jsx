import { useState } from "react";
import { useInView } from "react-intersection-observer";
import styles from "./Education.module.css";

export default function Education({ education }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpand = (index) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  // Sort education by end date (most recent first)
  const sortedEducation = [...education].sort((a, b) => {
    const dateA = new Date(a.endDate || 0);
    const dateB = new Date(b.endDate || 0);
    return dateB - dateA;
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
          {sortedEducation.map((edu, index) => {
            const isExpanded = expandedItems[index];
            const coursework = edu.relevantCoursework || [];
            const sortedCoursework = [...coursework].sort();

            return (
              <div key={index} className={styles.educationCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.institutionInfo}>
                    <h3 className={styles.institution}>{edu.institution}</h3>
                    <p className={styles.degree}>
                      {edu.degree} in {edu.fieldOfStudy}
                    </p>
                  </div>
                </div>

                <div className={styles.cardDates}>
                  <span className={styles.dateRange}>
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </span>
                </div>

                {coursework.length > 0 && (
                  <div className={styles.courseworkSection}>
                    <button
                      className={styles.toggleButton}
                      onClick={() => toggleExpand(index)}
                      aria-expanded={isExpanded}
                    >
                      <span>
                        {isExpanded ? "Hide" : "Show"} Relevant Coursework
                        {!isExpanded && ` (${coursework.length} courses)`}
                      </span>
                      <span className={styles.toggleIcon}>
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className={styles.courseworkContainer}>
                        {sortedCoursework.map((course, cIndex) => (
                          <span key={cIndex} className={styles.courseworkTag}>
                            {course}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
