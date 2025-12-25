import { useState } from "react";
import { useInView } from "react-intersection-observer";
import styles from "./LeadershipExperience.module.css";

export default function LeadershipExperience({ experience }) {
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
    if (!dateString) return "Present";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate) return "";
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();
    
    let duration = "";
    if (years > 0) {
      duration += `${years} ${years === 1 ? "year" : "years"}`;
    }
    if (months > 0) {
      if (duration) duration += ", ";
      duration += `${months} ${months === 1 ? "month" : "months"}`;
    }
    if (!duration) {
      duration = "Less than a month";
    }
    
    return duration;
  };

  // Sort experience by start date (most recent first)
  const sortedExperience = [...experience].sort((a, b) => {
    const dateA = new Date(a.startDate || 0);
    const dateB = new Date(b.startDate || 0);
    return dateB - dateA;
  });

  return (
    <>
      <hr />
      <section
        ref={ref}
        className={`${styles.leadershipExperience} ${inView ? styles.fadeIn : ""}`}
      >
        <h2>Leadership Experience</h2>
        <div className={styles.leadershipGrid}>
          {sortedExperience.map((exp, index) => {
            const isExpanded = expandedItems[index];
            const achievements = exp.achievements || [];
            const duration = calculateDuration(exp.startDate, exp.endDate);
            const isCurrent = !exp.endDate;

            return (
              <div key={index} className={styles.leadershipCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.leadershipInfo}>
                    <h3 className={styles.role}>{exp.role}</h3>
                    <p className={styles.organization}>{exp.organization}</p>
                  </div>
                </div>

                <div className={styles.cardDates}>
                  <span className={styles.dateRange}>
                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                  </span>
                  {duration && (
                    <span className={styles.duration}>• {duration}</span>
                  )}
                  {isCurrent && (
                    <span className={styles.currentBadge}>Current</span>
                  )}
                </div>

                {achievements.length > 0 && (
                  <div className={styles.achievementsSection}>
                    <button
                      className={styles.toggleButton}
                      onClick={() => toggleExpand(index)}
                      aria-expanded={isExpanded}
                    >
                      <span>
                        {isExpanded ? "Hide" : "Show"} Achievements
                        {!isExpanded && ` (${achievements.length})`}
                      </span>
                      <span className={styles.toggleIcon}>
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </button>

                    {isExpanded && (
                      <ul className={styles.achievementsList}>
                        {achievements.map((achievement, aIndex) => (
                          <li key={aIndex} className={styles.achievementItem}>
                            <span className={styles.achievementBullet}>▸</span>
                            <span className={styles.achievementText}>
                              {achievement}
                            </span>
                          </li>
                        ))}
                      </ul>
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
