import Link from "next/link";
import styles from "@/styles/ProjectsPage.module.css";

export default function ProjectHeader({ title, repositoryLink }) {
  return (
    <>
      <h2 className="h3">{title}</h2>
      <Link
        href={repositoryLink}
        target="_blank"
        className={`text-decoration-none ${styles.oswald} ${styles.redText} ${styles.link}`}
      >
        Source Code
      </Link>
    </>
  );
}
