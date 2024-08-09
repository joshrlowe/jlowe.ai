import { useEffect, useState } from "react";
import { ReactTyped } from "react-typed";
import { Container, Spinner } from "react-bootstrap";

import ProfessionalSummary from "@/components/About/ProfessionalSummary/ProfessionalSummary";
import TechnicalSkills from "@/components/About/TechnicalSkills/TechnicalSkills";
import ProfessionalExperience from "@/components/About/ProfessionalExperience/ProfessionalExperience";
import Education from "@/components/About/Education/Education";
import TechnicalCertifications from "@/components/About/TechnicalCertifications/TechnicalCertifications";
import LeadershipExperience from "@/components/About/LeadershipExperience/LeadershipExperience";
import Hobbies from "@/components/About/Hobbies/Hobbies";

import styles from "@/styles/AboutPage.module.css";

const AboutPage = () => {
  const [aboutData, setAboutData] = useState(null);
  const [showCursor, setShowCursor] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/about");
        const data = await response.json();
        setAboutData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  if (!aboutData) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Container className="my-5">
      <div className="mb-5">
        <h1 className={styles.pageTitle}>
          {showCursor && (
            <ReactTyped
              strings={["About Me"]}
              typeSpeed={25}
              onComplete={() => {
                setTimeout(() => setShowCursor(false), 1500);
                setTimeout(() => setShowContent(true), 250);
              }}
            />
          )}
          {!showCursor && "About Me"}
        </h1>
        {showContent && (
          <div>
            <ProfessionalSummary>
              {aboutData.professionalSummary}
            </ProfessionalSummary>
            <TechnicalSkills skills={aboutData.technicalSkills} />
            <ProfessionalExperience
              experience={aboutData.professionalExperience}
            />
            <Education education={aboutData.education} />
            <TechnicalCertifications
              certifications={aboutData.technicalCertifications}
            />
            <LeadershipExperience experience={aboutData.leadershipExperience} />
            <Hobbies hobbies={aboutData.hobbies} />
          </div>
        )}
      </div>
    </Container>
  );
};

export default AboutPage;
