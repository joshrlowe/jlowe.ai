import styles from "@/styles/ProjectsPage.module.css";

export default function ProjectDescription({ description }) {
  return <p className={styles.paragraphText}>{description}</p>;
}
