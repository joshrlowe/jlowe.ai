import { useEffect, useState } from "react";
import { ReactTyped } from "react-typed";
import { Container, Spinner } from "react-bootstrap";

import Project from "@/components/Project/Project";
import styles from "@/styles/ProjectsPage.module.css";

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [prevProject, setPrevProject] = useState(null);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      const response = await fetch("/api/projects");
      const projects = await response.json();
      setProjects(projects);
    }
    loadProjects();
  }, []);

  useEffect(() => {
    if (prevProject) {
      const timer = setTimeout(() => {
        setPrevProject(null);
      }, 500); // Duration of the fade-out animation

      return () => clearTimeout(timer);
    }
  }, [prevProject]);

  if (!projects) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
      </div>
    );
  }

  function handleProjectClick(project) {
    if (selectedProject && selectedProject._id !== project._id) {
      setPrevProject(selectedProject);
      setSelectedProject(null);
      setTimeout(() => {
        setSelectedProject(project);
      }, 100); // Small delay to allow fade-out to start
    } else {
      setSelectedProject(project);
    }
  }

  return (
    <div className="container my-5">
      <h1 className={`mb-4 ${styles.redText} ${styles.pageTitle}`}>
        {showCursor && (
          <ReactTyped
            strings={["Projects"]}
            typeSpeed={25}
            showCursor={showCursor}
            onComplete={() => setTimeout(() => setShowCursor(false), 1000)}
          />
        )}
        {!showCursor && "Projects"}
      </h1>
      <div className="row">
        <div className="col-md-4">
          <ul className="list-group">
            {projects.map((project, index) => (
              <li
                key={project._id}
                className={`list-group-item ${styles.lightGrayBg} ${styles.projectListItem} ${styles.flyInLeft} ${styles.staggered}`}
                style={{ "--animation-delay": `${index * 0.1 + 0.3}s` }}
                onClick={() => handleProjectClick(project)}
              >
                <span
                  className={`h3 text-decoration-none fw-normal ${styles.oswald} ${styles.link}`}
                >
                  {project.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-8 position-relative">
          {prevProject && <Project project={prevProject} />}
          {selectedProject && <Project project={selectedProject} fadeIn />}
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
