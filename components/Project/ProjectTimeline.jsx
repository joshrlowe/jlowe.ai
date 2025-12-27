import React from "react";
import { formatDateUTC } from "@/lib/utils/dateUtils";
import styles from "@/styles/ProjectsPage.module.css";

function ProjectTimeline({ startDate, releaseDate, status }) {
  return (
    <>
      <p className={styles.paragraphText}>
        <span className={styles.emphasisText}>Start Date: </span>
        {formatDateUTC(startDate)}
      </p>
      <p className={styles.paragraphText}>
        <span className={styles.emphasisText}>Release Date: </span>
        {releaseDate ? formatDateUTC(releaseDate) : "N/A"}
      </p>
      <p className={styles.paragraphText}>
        <span className={styles.emphasisText}>Status: </span>
        {status}
      </p>
    </>
  );
}

export default React.memo(ProjectTimeline);
