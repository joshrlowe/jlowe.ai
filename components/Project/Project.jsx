import styles from "@/styles/ProjectsPage.module.css";

import ProjectHeader from "./ProjectHeader";
import ProjectDescription from "./ProjectDescription";
import ProjectTechStack from "./ProjectTechStack";
import ProjectTimeline from "./ProjectTimeline";
import ProjectTeam from "./ProjectTeam";

export default function Project({ project, fadeIn }) {
  const styleAction = fadeIn ? styles.slideFadeInRight : styles.fadeOut;

  return (
    <div className={`card ${styles.lightGrayBg} p-3 ${styleAction}`}>
      <ProjectHeader
        title={project.title}
        repositoryLink={project.repositoryLink}
      />
      <hr />
      <ProjectDescription description={project.description} />
      <hr />
      <ProjectTechStack techStack={project.techStack} />
      <hr />
      <ProjectTimeline
        startDate={project.startDate}
        releaseDate={project.releaseDate}
        status={project.status}
      />
      <hr />
      <ProjectTeam team={project.team} />
    </div>
  );
}
