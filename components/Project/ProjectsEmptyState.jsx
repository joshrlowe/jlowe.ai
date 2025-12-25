import { Container } from "react-bootstrap";
import Link from "next/link";
import styles from "@/styles/ProjectsEmptyState.module.css";

export default function ProjectsEmptyState({ hasFilters = false, onClearFilters }) {
  return (
    <Container className={styles.emptyState}>
      <div className={styles.content}>
        <div className={styles.icon}>📁</div>
        <h2 className={styles.title}>
          {hasFilters ? "No projects match your filters" : "No projects yet"}
        </h2>
        <p className={styles.message}>
          {hasFilters
            ? "Try adjusting your search or filter criteria to see more projects."
            : "Projects will appear here once they are added to the portfolio."}
        </p>
        <div>
          {hasFilters && onClearFilters ? (
            <button onClick={onClearFilters} className={styles.clearButton}>
              Clear All Filters
            </button>
          ) : (
            <Link href="/" className={styles.homeLink} suppressHydrationWarning>
              Return to Home
            </Link>
          )}
        </div>
      </div>
    </Container>
  );
}

