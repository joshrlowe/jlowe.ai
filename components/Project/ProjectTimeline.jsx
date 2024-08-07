import styles from "@/styles/ProjectsPage.module.css";

export default function ProjectTimeline({ startDate, releaseDate, status }) {
  return (
    <>
      <p className={styles.paragraphText}>
        <span className={styles.emphasisText}>Start Date: </span>
        {new Date(startDate).toLocaleDateString("en-US", {
          timeZone: "UTC",
        })}
      </p>
      <p className={styles.paragraphText}>
        <span className={styles.emphasisText}>Release Date: </span>
        {new Date(releaseDate).toLocaleDateString("en-US", {
          timeZone: "UTC",
        })}
      </p>
      <p className={styles.paragraphText}>
        <span className={styles.emphasisText}>Status: </span>
        {status}
      </p>
    </>
  );
}
