import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { set } from "@/models/TechStack";

export default function ProjectPage() {
  const router = useRouter();
  const { id } = router.query;

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      const response = await fetch(`/api/projects/${id}`);
      const project = await response.json();
      setProject(project);
      setLoading(false);
    }
    loadProject();
  }, [id]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>{project.title}</h1>
      <h2>Authors:</h2>
      <ul>
        {project.team.map((author) => (
          <li key={author.email}>
            <p>
              <strong>{author.name}</strong>: {author.role}{" "}
              <a href={`mailto:${author.email}`}>Email</a>
            </p>
          </li>
        ))}
      </ul>
      <h2>Tech Stack:</h2>
      <ul>
        {project.techStack.backendFramework && (
          <li>Backend Framework: {project.techStack.backendFramework}</li>
        )}
        {project.techStack.frontendFramework && (
          <li>Frontend Framework: {project.techStack.frontendFramework}</li>
        )}
        {project.techStack.database && (
          <li>Database: {project.techStack.database}</li>
        )}
        {project.techStack.versionControl && (
          <li>Version Control: {project.techStack.versionControl}</li>
        )}
        {project.techStack.operatingSystem && (
          <li>Operating System: {project.techStack.operatingSystem}</li>
        )}
        {project.techStack.webServer && (
          <li>Web Server: {project.techStack.webServer}</li>
        )}
      </ul>
      <h3>API Integrations</h3>
      <ul>
        {project.techStack.apiIntegrations.map((api) => (
          <li key={api.name}>
            <p>
              <strong>{api.name}</strong>: <a href={api.url}>{api.url}</a>
            </p>
          </li>
        ))}
      </ul>
      <h3>Deployment Tools</h3>
      <ul>
        {project.techStack.deploymentTools.map((tool) => (
          <li key={tool.name}>
            <p>
              <strong>{tool.name}</strong>: {tool.description}
            </p>
          </li>
        ))}
      </ul>
      <h3>Additional Tools</h3>
      <ul>
        {project.techStack.additionalTools.map((tool) => (
          <li key={tool.name}>
            <p>
              <strong>{tool.name}</strong>: {tool.description}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
