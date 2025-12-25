import Link from "next/link";
import styles from "@/styles/ProjectsPage.module.css";

const techStackToString = (techStack) => {
  const stack = [];

  if (techStack.fullStackFramework)
    stack.push(`${techStack.fullStackFramework}`);
  if (techStack.backendFramework) stack.push(`${techStack.backendFramework}`);
  if (techStack.frontendFramework) stack.push(`${techStack.frontendFramework}`);
  if (techStack.database) stack.push(`${techStack.database}`);

  return stack.join(", ");
};

const namesToString = (objects) => {
  return objects.map((obj) => obj.name).join(", ");
};

export default function ProjectTechStack({ techStack }) {
  const highLevelTechStack = techStackToString(techStack);

  return (
    <>
      {highLevelTechStack && (
        <p className={styles.paragraphText}>
          <span className={styles.emphasisText}>Technology Stack:</span>{" "}
          {highLevelTechStack}
        </p>
      )}

      {techStack.languages && techStack.languages.length > 0 && (
        <p className={styles.paragraphText}>
          <span className={styles.emphasisText}>
            Language{techStack.languages.length > 1 && "s"}:
          </span>{" "}
          {techStack.languages.join(", ")}
        </p>
      )}

      {techStack.apiIntegrations && techStack.apiIntegrations.length > 0 && (
        <p className={styles.paragraphText}>
          <span className={styles.emphasisText}>
            API Integration{techStack.apiIntegrations.length > 1 && "s"}:
          </span>{" "}
          {techStack.apiIntegrations.map((api, index) => (
            <Link
              key={index}
              href={api.url}
              target="_blank"
              className={`${styles.link} ${styles.redText}`}
            >
              {api.name}
            </Link>
          ))}
        </p>
      )}

      {techStack.webServers && techStack.webServers.length > 0 && (
        <p className={styles.paragraphText}>
          <span className={styles.emphasisText}>
            Web Server{techStack.webServers.length > 1 && "s"}:
          </span>{" "}
          {techStack.webServers.join(", ")}
        </p>
      )}

      {techStack.deploymentTools && techStack.deploymentTools.length > 0 && (
        <p className={styles.paragraphText}>
          <span className={styles.emphasisText}>
            Deployment Tool{techStack.deploymentTools.length > 1 && "s"}:
          </span>{" "}
          {namesToString(techStack.deploymentTools)}
        </p>
      )}

      {techStack.additionalTools && techStack.additionalTools.length > 0 && (
        <p className={styles.paragraphText}>
          <span className={styles.emphasisText}>
            Additional Tool{techStack.additionalTools.length > 1 && "s"}:
          </span>{" "}
          {namesToString(techStack.additionalTools)}
        </p>
      )}
      {techStack.operatingSystem && (
        <p className={styles.paragraphText}>
          <span className={styles.emphasisText}>Operating System:</span>{" "}
          {techStack.operatingSystem}
        </p>
      )}
    </>
  );
}
