import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import styles from "@/styles/ProjectsPage.module.css";

import ProjectHeader from "./ProjectHeader";
import ProjectDescription from "./ProjectDescription";
import ProjectTechStack from "./ProjectTechStack";
import ProjectTimeline from "./ProjectTimeline";
import ProjectTeam from "./ProjectTeam";
import type { ProjectLike, ProjectTechStackShape } from "./types";

interface ProjectProps {
  project: ProjectLike;
  fadeIn?: boolean;
}

export default function Project({ project, fadeIn }: ProjectProps) {
  const projectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fadeIn && projectRef.current) {
      gsap.fromTo(
        projectRef.current,
        {
          opacity: 0,
          x: 100,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          ease: "power2.out",
        }
      );
    } else if (!fadeIn && projectRef.current) {
      gsap.to(projectRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      });
    }
  }, [fadeIn]);

  return (
    <div
      ref={projectRef}
      className={`card ${styles.lightGrayBg} p-3`}
      style={{ willChange: "opacity, transform" }}
    >
      <ProjectHeader title={project.title} repositoryLink={project.repositoryLink ?? undefined} />
      <hr />
      <ProjectDescription description={project.description ?? ""} />
      <hr />
      <ProjectTechStack techStack={(project.techStack ?? {}) as ProjectTechStackShape} />
      <hr />
      <ProjectTimeline
        startDate={project.startDate ?? null}
        releaseDate={project.releaseDate ?? null}
        status={project.status ?? ""}
      />
      <hr />
      <ProjectTeam team={project.team ?? []} />
    </div>
  );
}
