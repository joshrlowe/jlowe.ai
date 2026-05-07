import React from "react";
import { formatDateUTC } from "@/lib/utils/dateUtils";
import styles from "@/styles/ProjectsPage.module.css";

interface ProjectTimelineProps {
  startDate?: string | Date | null;
  releaseDate?: string | Date | null;
  status?: string;
}

function ProjectTimeline({ startDate, releaseDate, status }: ProjectTimelineProps) {
  return (
    <>
      <p className={styles.paragraphText}>
        <span className={styles.emphasisText}>Start Date: </span>
        {startDate ? formatDateUTC(startDate) : "N/A"}
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
