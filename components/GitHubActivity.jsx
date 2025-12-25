import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import Link from "next/link";
import styles from "@/styles/GitHubActivity.module.css";

export default function GitHubActivity({ githubUrl }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!githubUrl) {
      setLoading(false);
      return;
    }

    // Extract username from GitHub URL
    const match = githubUrl.match(/github\.com\/([^\/]+)/);
    if (!match) {
      setLoading(false);
      return;
    }

    const username = match[1];

    // Fetch GitHub stats (using GitHub API)
    // Note: This requires GitHub token for rate limits or use public endpoint
    const fetchGitHubStats = async () => {
      try {
        // For now, we'll just show a placeholder or use GitHub's public profile
        // In production, you'd want to fetch actual contribution data
        setStats({
          username,
          contributions: null, // Would be fetched from API
        });
      } catch (error) {
        console.error("Failed to fetch GitHub stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubStats();
  }, [githubUrl]);

  if (!githubUrl || loading) {
    return null;
  }

  return (
    <section className={styles.githubSection} aria-label="GitHub activity">
      <Container>
        <div className={styles.githubCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>GitHub Activity</h3>
            <Link
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.githubLink}
              aria-label="Visit GitHub profile"
            >
              View Profile →
            </Link>
          </div>
          {stats && (
            <div className={styles.statsContainer}>
              <div className={styles.contributionsPlaceholder}>
                <p className={styles.placeholderText}>
                  View my contributions and repositories on GitHub
                </p>
                <Link
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.viewButton}
                >
                  View on GitHub
                </Link>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

