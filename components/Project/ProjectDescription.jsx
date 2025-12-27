import React from "react";
import styles from "@/styles/ProjectsPage.module.css";

function ProjectDescription({ description }) {
  return <p className={styles.paragraphText}>{description}</p>;
}

export default React.memo(ProjectDescription);
