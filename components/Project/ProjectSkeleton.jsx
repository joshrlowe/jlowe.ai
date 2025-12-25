import { Container, Row, Col } from "react-bootstrap";
import { TableRowSkeleton } from "../admin/SkeletonLoader";
import styles from "@/styles/ProjectCard.module.css";

export default function ProjectSkeleton({ count = 6 }) {
  return (
    <Row className="g-4">
      {Array.from({ length: count }).map((_, i) => (
        <Col key={i} md={6} lg={4}>
          <div className={styles.projectCard} style={{ minHeight: "400px" }}>
            <div
              style={{
                width: "100%",
                height: "200px",
                background: "var(--color-bg-dark-alt)",
                borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
              }}
            />
            <div style={{ padding: "var(--spacing-xl)" }}>
              <div
                style={{
                  height: "24px",
                  width: "70%",
                  background: "var(--color-bg-dark-alt)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "var(--spacing-md)",
                }}
              />
              <div
                style={{
                  height: "16px",
                  width: "100%",
                  background: "var(--color-bg-dark-alt)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "var(--spacing-xs)",
                }}
              />
              <div
                style={{
                  height: "16px",
                  width: "80%",
                  background: "var(--color-bg-dark-alt)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "var(--spacing-lg)",
                }}
              />
              <div
                style={{
                  height: "12px",
                  width: "50%",
                  background: "var(--color-bg-dark-alt)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "var(--spacing-md)",
                }}
              />
            </div>
          </div>
        </Col>
      ))}
    </Row>
  );
}

