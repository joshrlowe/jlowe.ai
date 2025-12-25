import { Modal } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import styles from "@/styles/ProjectPreview.module.css";

export default function ProjectPreview({ project, show, onHide }) {
  if (!project) return null;

  return (
    <Modal show={show} onHide={onHide} size="xl" centered className="adminWrapper">
      <Modal.Header closeButton>
        <Modal.Title>{project.title || "Project Preview"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className={styles.previewContent}>
          <div className={styles.previewHeader}>
            <h1>{project.title}</h1>
            {project.status && (
              <span className={`badge ${project.status === "Published" ? "bg-success" : "bg-secondary"}`}>
                {project.status}
              </span>
            )}
          </div>

          {project.shortDescription && (
            <p className={styles.previewDescription}>{project.shortDescription}</p>
          )}

          {project.longDescription && (
            <div className={styles.previewMarkdown}>
              <ReactMarkdown>{project.longDescription}</ReactMarkdown>
            </div>
          )}

          {project.tags && Array.isArray(project.tags) && project.tags.length > 0 && (
            <div className={styles.previewTags}>
              <strong>Tags: </strong>
              {project.tags.map((tag, i) => (
                <span key={i} className="badge bg-secondary me-2">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {project.techStack && Array.isArray(project.techStack) && project.techStack.length > 0 && (
            <div className={styles.previewTech}>
              <strong>Tech Stack: </strong>
              {project.techStack.map((tech, i) => (
                <span key={i} className="badge bg-primary me-2">
                  {tech}
                </span>
              ))}
            </div>
          )}

          {(project.links?.github || project.links?.live) && (
            <div className={styles.previewLinks}>
              {project.links.github && (
                <a href={project.links.github} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary me-2">
                  GitHub
                </a>
              )}
              {project.links.live && (
                <a href={project.links.live} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  Live Site
                </a>
              )}
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={onHide}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
}

