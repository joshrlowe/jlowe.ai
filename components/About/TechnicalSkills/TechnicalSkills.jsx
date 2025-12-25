import { useState } from "react";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import styles from "./TechnicalSkills.module.css";

export default function TechnicalSkills({ skills = [] }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [selectedCategory, setSelectedCategory] = useState(null);

  // Safety check: ensure skills is an array
  if (!Array.isArray(skills)) {
    if (process.env.NODE_ENV === "development") {
      console.warn("TechnicalSkills: skills is not an array", skills);
    }
    return (
      <div>
        <p>No skills data available.</p>
      </div>
    );
  }

  // Group skills by category
  const categorizedSkills = {};
  
  skills.forEach((skill) => {
    if (!skill) return;
    const category = skill.category || "Other";
    if (!categorizedSkills[category]) {
      categorizedSkills[category] = [];
    }
    categorizedSkills[category].push(skill);
  });

  // Calculate progress percentage from expertise level (1-5 scale to 0-100%)
  const getProgressPercentage = (expertiseLevel) => {
    if (!expertiseLevel || typeof expertiseLevel !== 'number') return 60;
    return (expertiseLevel / 5) * 100;
  };

  const getProgressLabel = (expertiseLevel) => {
    if (!expertiseLevel || typeof expertiseLevel !== 'number') return 'Intermediate';
    if (expertiseLevel >= 4.5) return 'Expert';
    if (expertiseLevel >= 3.5) return 'Advanced';
    if (expertiseLevel >= 2.5) return 'Intermediate';
    if (expertiseLevel >= 1.5) return 'Beginner';
    return 'Novice';
  };

  const toggleCategory = (category) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  return (
    <>
      <hr />
      <section
        ref={ref}
        className={`${styles.technicalSkills} ${inView ? styles.fadeIn : ""}`}
      >
        <h2>Technical Skills</h2>
        
        {/* Category Filter Buttons */}
        <div className={styles.categoryFilters}>
          <button
            className={selectedCategory === null ? styles.filterActive : styles.filterButton}
            onClick={() => setSelectedCategory(null)}
          >
            All Skills
          </button>
          {Object.keys(categorizedSkills).map((category) => (
            <button
              key={category}
              className={selectedCategory === category ? styles.filterActive : styles.filterButton}
              onClick={() => toggleCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Skills Grid */}
        <div className={styles.skillsGrid}>
          {Object.entries(categorizedSkills).map(([category, categorySkills]) => {
            // Filter by selected category
            if (selectedCategory !== null && selectedCategory !== category) {
              return null;
            }

            return (
              <div key={category} className={styles.categorySection}>
                <h3 className={styles.categoryTitle}>{category}</h3>
                <div className={styles.skillsList}>
                  {categorySkills.map((skill, index) => {
                    const progress = getProgressPercentage(skill.expertiseLevel);
                    const progressLabel = getProgressLabel(skill.expertiseLevel);
                    const projects = skill.projects || [];

                    return (
                      <div key={index} className={styles.skillCard}>
                        <div className={styles.skillHeader}>
                          <span className={styles.skillName}>{skill.skillName}</span>
                          <span className={styles.skillLevel}>{progressLabel}</span>
                        </div>
                        <div className={styles.progressBarContainer}>
                          <div
                            className={styles.progressBar}
                            style={{
                              width: inView ? `${progress}%` : '0%',
                              transition: `width 1s ease-out ${index * 0.05}s`,
                            }}
                          />
                        </div>
                        {projects.length > 0 && (
                          <div className={styles.skillProjects}>
                            <span className={styles.projectsLabel}>Used in:</span>
                            <div className={styles.projectsList}>
                              {projects.slice(0, 3).map((project, pIndex) => (
                                <Link
                                  key={pIndex}
                                  href={project.repositoryLink || '#'}
                                  className={styles.projectLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {project.name}
                                </Link>
                              ))}
                              {projects.length > 3 && (
                                <span className={styles.moreProjects}>
                                  +{projects.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
