import React from "react";
import styles from "@/styles/ProjectsPage.module.css";

function ProjectTeam({ team }) {
  return (
    <div className={styles.teamContainer}>
      {team && team.length > 1 && <p className={styles.teamHeader}>Team</p>}
      {(!team || team.length === 0) && (
        <p className={styles.teamHeader}>Author</p>
      )}
      {team && team.length > 0 && (
        <ul className={styles.teamList}>
          {team.map((member, index) => (
            <li key={index} className={styles.teamMember}>
              <span className={styles.memberName}>{member.name}</span>
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className={`${styles.link} ${styles.redText}`}
                >
                  Email
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default React.memo(ProjectTeam);
