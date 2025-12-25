import { useEffect, useRef, useState } from "react";
import { Container } from "react-bootstrap";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import prisma from "@/lib/prisma";

import SEO from "@/components/SEO";
import AboutHero from "@/components/About/AboutHero/AboutHero";
import ProfessionalSummary from "@/components/About/ProfessionalSummary/ProfessionalSummary";
import TechnicalSkills from "@/components/About/TechnicalSkills/TechnicalSkills";
import ProfessionalExperience from "@/components/About/ProfessionalExperience/ProfessionalExperience";
import Education from "@/components/About/Education/Education";
import TechnicalCertifications from "@/components/About/TechnicalCertifications/TechnicalCertifications";
import LeadershipExperience from "@/components/About/LeadershipExperience/LeadershipExperience";
import Hobbies from "@/components/About/Hobbies/Hobbies";
import TableOfContents from "@/components/About/TableOfContents/TableOfContents";

import styles from "@/styles/AboutPage.module.css";

// Dynamically import components that use GSAP ScrollTrigger to avoid SSR issues
const DynamicTechnicalSkills = dynamic(
  () => import("@/components/About/TechnicalSkills/TechnicalSkills"),
  { ssr: false }
);
const DynamicProfessionalExperience = dynamic(
  () => import("@/components/About/ProfessionalExperience/ProfessionalExperience"),
  { ssr: false }
);
const DynamicEducation = dynamic(
  () => import("@/components/About/Education/Education"),
  { ssr: false }
);
const DynamicTechnicalCertifications = dynamic(
  () => import("@/components/About/TechnicalCertifications/TechnicalCertifications"),
  { ssr: false }
);
const DynamicLeadershipExperience = dynamic(
  () => import("@/components/About/LeadershipExperience/LeadershipExperience"),
  { ssr: false }
);
const DynamicHobbies = dynamic(
  () => import("@/components/About/Hobbies/Hobbies"),
  { ssr: false }
);

gsap.registerPlugin(ScrollTrigger);

const AboutPage = ({ aboutData, welcomeData, contactData }) => {
  const contentRef = useRef(null);
  const [activeSection, setActiveSection] = useState("");

  // Initialize GSAP ScrollTrigger animations on client side
  useEffect(() => {
    if (typeof window === 'undefined' || !contentRef.current) return;
    
    const elements = contentRef.current.querySelectorAll('.fade-in-on-scroll');
    
    if (elements.length === 0) return;
    
    // Only animate if GSAP is available
    if (typeof gsap === 'undefined') return;
    
    elements.forEach((element, index) => {
      // Set initial state to visible, then animate from invisible
      gsap.set(element, { opacity: 1, y: 0 }); // Ensure visible by default
      gsap.fromTo(element, 
        {
          opacity: 0,
          y: 50,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 85%",
            toggleActions: "play none none none"
          },
          delay: index * 0.1,
          immediateRender: false, // Don't apply initial values immediately
        }
      );
    });

    // Track active section for table of contents
    const sections = document.querySelectorAll('[id^="section-"]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-100px 0px -66% 0px" }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  // Data is already serialized from getStaticProps, no need to parse again
  // Just use it directly or create a safe copy
  const serializedData = aboutData || {};
  
  // Debug logging (remove in production)
  if (typeof window !== 'undefined') {
    console.log('About page data:', {
      hasAboutData: !!aboutData,
      hasTechnicalSkills: !!serializedData?.technicalSkills,
      skillsLength: Array.isArray(serializedData?.technicalSkills) ? serializedData.technicalSkills.length : 0,
      hasExperience: !!serializedData?.professionalExperience,
      experienceLength: Array.isArray(serializedData?.professionalExperience) ? serializedData.professionalExperience.length : 0,
    });
  }
  
  // Extract professional summary for SEO
  const summaryText = serializedData?.professionalSummary
    ? serializedData.professionalSummary.replace(/<[^>]*>/g, '').substring(0, 160)
    : "Full stack developer with extensive experience in modern web technologies";

  return (
    <>
      <SEO
        title="About Me"
        description={summaryText}
        url="https://jlowe.ai/about"
        type="profile"
        name={welcomeData?.name || "Josh Lowe"}
        aboutData={serializedData}
        contactData={contactData}
      />
      <Container className={styles.aboutContainer}>
        <div className={styles.aboutWrapper}>
          <div className={styles.contentArea}>
            <div ref={contentRef}>
              {/* Hero Section */}
              <section id="section-hero" className="fade-in-on-scroll">
                <AboutHero
                  name={welcomeData?.name}
                  briefBio={welcomeData?.briefBio}
                  contactData={contactData}
                  professionalSummary={serializedData?.professionalSummary || ""}
                />
              </section>

              {/* Professional Summary */}
              <section id="section-summary" className="fade-in-on-scroll">
                <ProfessionalSummary>
                  {serializedData?.professionalSummary || ""}
                </ProfessionalSummary>
              </section>

              {/* Technical Skills */}
              {serializedData?.technicalSkills && Array.isArray(serializedData.technicalSkills) && serializedData.technicalSkills.length > 0 && (
                <section id="section-skills" className="fade-in-on-scroll">
                  <DynamicTechnicalSkills skills={serializedData.technicalSkills} />
                </section>
              )}

              {/* Professional Experience */}
              {serializedData?.professionalExperience && Array.isArray(serializedData.professionalExperience) && serializedData.professionalExperience.length > 0 && (
                <section id="section-experience" className="fade-in-on-scroll">
                  <DynamicProfessionalExperience
                    experience={serializedData.professionalExperience}
                  />
                </section>
              )}

              {/* Education */}
              {serializedData?.education && Array.isArray(serializedData.education) && serializedData.education.length > 0 && (
                <section id="section-education" className="fade-in-on-scroll">
                  <DynamicEducation education={serializedData.education} />
                </section>
              )}

              {/* Technical Certifications */}
              {serializedData?.technicalCertifications && Array.isArray(serializedData.technicalCertifications) && serializedData.technicalCertifications.length > 0 && (
                <section id="section-certifications" className="fade-in-on-scroll">
                  <DynamicTechnicalCertifications
                    certifications={serializedData.technicalCertifications}
                  />
                </section>
              )}

              {/* Leadership Experience */}
              {serializedData?.leadershipExperience && Array.isArray(serializedData.leadershipExperience) && serializedData.leadershipExperience.length > 0 && (
                <section id="section-leadership" className="fade-in-on-scroll">
                  <DynamicLeadershipExperience
                    experience={serializedData.leadershipExperience}
                  />
                </section>
              )}

              {/* Hobbies */}
              {serializedData?.hobbies && Array.isArray(serializedData.hobbies) && serializedData.hobbies.length > 0 && (
                <section id="section-hobbies" className="fade-in-on-scroll">
                  <DynamicHobbies hobbies={serializedData.hobbies} />
                </section>
              )}
            </div>
          </div>

          {/* Table of Contents Sidebar */}
          <aside className={styles.sidebar}>
            <TableOfContents activeSection={activeSection} />
          </aside>
        </div>
      </Container>
    </>
  );
};

export async function getStaticProps() {
  try {
    const [aboutData, welcomeData, contactData] = await Promise.all([
      prisma.about.findFirst({
        orderBy: { createdAt: "desc" },
      }),
      prisma.welcome.findFirst({
        orderBy: { createdAt: "desc" },
      }),
      prisma.contact.findFirst({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Debug logging
    console.log('About page getStaticProps:', {
      hasAboutData: !!aboutData,
      aboutKeys: aboutData ? Object.keys(aboutData) : [],
      technicalSkillsType: aboutData?.technicalSkills ? typeof aboutData.technicalSkills : 'undefined',
      technicalSkillsIsArray: Array.isArray(aboutData?.technicalSkills),
      technicalSkillsLength: Array.isArray(aboutData?.technicalSkills) ? aboutData.technicalSkills.length : 'N/A',
    });

    if (!aboutData) {
      console.warn('No about data found in database');
      return {
        notFound: true,
      };
    }

    // Serialize Date objects to ISO strings for JSON
    const serializedAboutData = {
      ...aboutData,
      createdAt: aboutData.createdAt.toISOString(),
      updatedAt: aboutData.updatedAt.toISOString(),
    };

    const serializedWelcomeData = welcomeData
      ? {
          ...welcomeData,
          createdAt: welcomeData.createdAt.toISOString(),
          updatedAt: welcomeData.updatedAt.toISOString(),
        }
      : null;

    const serializedContactData = contactData
      ? {
          ...contactData,
          createdAt: contactData.createdAt.toISOString(),
          updatedAt: contactData.updatedAt.toISOString(),
        }
      : null;

    return {
      props: {
        aboutData: serializedAboutData,
        welcomeData: serializedWelcomeData,
        contactData: serializedContactData,
      },
      revalidate: 60, // ISR: revalidate every 60 seconds
    };
  } catch (error) {
    console.error("Error fetching about page data:", error);
    return {
      notFound: true,
    };
  }
}

export default AboutPage;
