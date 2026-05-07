import React from "react";
import styles from "@/styles/ProjectsPage.module.css";

interface ProjectDescriptionProps {
  description?: string | null;
}

function ProjectDescription({ description }: ProjectDescriptionProps) {
  return <p className={styles.paragraphText}>{description}</p>;
}

export default React.memo(ProjectDescription);
