import React, { useEffect, useState } from "react";

const AboutPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/about");
        const aboutData = await response.json();
        setData(aboutData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>About</h1>

      <section>
        <h2>Professional Summary</h2>
        <p>{data.professionalSummary}</p>
      </section>

      <section>
        <h2>Technical Skills</h2>
        <ul>
          {data.technicalSkills.map((skill, index) => (
            <li key={index}>{skill}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Professional Experience</h2>
        {data.professionalExperience.map((experience, index) => (
          <div key={index}>
            <h3>
              {experience.role} at {experience.company}
            </h3>
            <p>{experience.description}</p>
            <p>
              From: {new Date(experience.startDate).toLocaleDateString()} To:{" "}
              {new Date(experience.endDate).toLocaleDateString()}
            </p>
            <ul>
              {experience.achievements.map((achievement, i) => (
                <li key={i}>{achievement}</li>
              ))}
            </ul>
            <div>
              <h4>Project Links</h4>
              <ul>
                {experience.projectLinks.map((link, i) => (
                  <li key={i}>
                    <a href={link}>{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2>Education</h2>
        {data.education.map((edu, index) => (
          <div key={index}>
            <h3>
              {edu.degree} in {edu.fieldOfStudy}
            </h3>
            <p>{edu.institution}</p>
            <p>
              From: {new Date(edu.startDate).toLocaleDateString()} To:{" "}
              {new Date(edu.endDate).toLocaleDateString()}
            </p>
          </div>
        ))}
      </section>

      <section>
        <h2>Certifications</h2>
        {data.certifications.map((certification, index) => (
          <div key={index}>
            <h3>{certification.name}</h3>
            <p>Issued by: {certification.issuingOrganization}</p>
            <p>
              Issue Date:{" "}
              {new Date(certification.issueDate).toLocaleDateString()}
            </p>
            <p>
              Expiration Date:{" "}
              {new Date(certification.expirationDate).toLocaleDateString()}
            </p>
            <p>Credential ID: {certification.credentialId}</p>
            <a href={certification.credentialUrl}>Credential URL</a>
          </div>
        ))}
      </section>

      <section>
        <h2>Personal Projects</h2>
        {data.personalProjects.map((project, index) => (
          <div key={index}>
            <h3>{project.name}</h3>
            <p>{project.description}</p>
            <a href={project.link}>Project Link</a>
            <br />
            <a href={project.githubRepo}>GitHub Repo</a>
          </div>
        ))}
      </section>

      <section>
        <h2>Contact Information</h2>
        <p>Email: {data.contactInformation.email}</p>
        <div>
          <h3>Social Links</h3>
          {Object.keys(data.contactInformation.socialLinks).map((key) => (
            <p key={key}>
              {key}:{" "}
              {Array.isArray(data.contactInformation.socialLinks[key]) ? (
                data.contactInformation.socialLinks[key].map((link, i) => (
                  <a key={i} href={link}>
                    {link}
                  </a>
                ))
              ) : (
                <a href={data.contactInformation.socialLinks[key]}>
                  {data.contactInformation.socialLinks[key]}
                </a>
              )}
            </p>
          ))}
        </div>
      </section>

      <section>
        <h2>Personal Touch</h2>
        <div>
          <h3>Interests</h3>
          <ul>
            {data.personalTouch.interests.map((interest, index) => (
              <li key={index}>{interest}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Volunteer Work</h3>
          {data.personalTouch.volunteerWork.map((work, index) => (
            <div key={index}>
              <h4>
                {work.role} at {work.organization}
              </h4>
              <p>{work.description}</p>
              <p>
                From: {new Date(work.startDate).toLocaleDateString()} To:{" "}
                {new Date(work.endDate).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Professional Photo</h2>
        <img src={data.professionalPhoto} alt="Professional" />
      </section>
    </div>
  );
};

export default AboutPage;
