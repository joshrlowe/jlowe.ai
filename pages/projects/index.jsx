import { useEffect, useState } from "react";
import Link from "next/link";

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    async function loadProjects() {
      const response = await fetch("/api/projects");
      const projects = await response.json();
      setProjects(projects);
    }
    loadProjects();
  }, []);


  if (projects.length === 0) {
    return <div>Loading projects...</div>;
  }

  return (
    <div>
      <h1>Projects</h1>
      <ul>
        {projects.map((project) => (
          <li key={project._id}>
            <h2>{project.title}</h2>
            <p>{project.repositoryLink}</p>
            <p>
              Start Date: {new Date(project.startDate).toLocaleDateString()}
            </p>
            <p>
              Release Date: {new Date(project.releaseDate).toLocaleDateString()}
            </p>
            <Link href={`/projects/${project._id}`}>View Project</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectsPage;
