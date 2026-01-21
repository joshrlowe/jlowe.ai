import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import prisma from "@/lib/prisma";
import SEO from "@/components/SEO";
import AboutHero from "@/components/About/AboutHero/AboutHero";
import ProfessionalSummary from "@/components/About/ProfessionalSummary/ProfessionalSummary";
import TableOfContents from "@/components/About/TableOfContents/TableOfContents";
import TechnicalSkills from "@/components/About/TechnicalSkills/TechnicalSkills";
import ProfessionalExperience from "@/components/About/ProfessionalExperience/ProfessionalExperience";
import Education from "@/components/About/Education/Education";
import TechnicalCertifications from "@/components/About/TechnicalCertifications/TechnicalCertifications";
import LeadershipExperience from "@/components/About/LeadershipExperience/LeadershipExperience";
import ProfessionalDevelopment from "@/components/About/ProfessionalDevelopment/ProfessionalDevelopment";
import Hobbies from "@/components/About/Hobbies/Hobbies";

const AboutPage = ({ aboutData, welcomeData, contactData, ownerName }) => {
  const contentRef = useRef(null);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    if (typeof window === "undefined" || !contentRef.current) return;

    const elements = contentRef.current.querySelectorAll(".fade-in-on-scroll");

    if (elements.length === 0) return;

    elements.forEach((element, index) => {
      // Set initial state for smooth animation
      gsap.set(element, { opacity: 0, y: 20 });
      
      gsap.to(element, {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: "power2.out",
        scrollTrigger: {
          trigger: element,
          start: "top 92%",
          toggleActions: "play none none none",
        },
        delay: index * 0.04,
        overwrite: true,
      });
    });

    const sections = document.querySelectorAll("[id^='section-']");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-100px 0px -66% 0px" },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const serializedData = aboutData || {};

  const summaryText = serializedData?.professionalSummary
    ? serializedData.professionalSummary
        .replace(/<[^>]*>/g, "")
        .substring(0, 160)
    : "Full stack developer with extensive experience in modern web technologies";

  return (
    <>
      <SEO
        title={ownerName || "About Me"}
        description={summaryText}
        url="https://jlowe.ai/about"
        type="profile"
      />
      <div className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Main Content */}
            <div className="flex-1 min-w-0" ref={contentRef}>
              {/* Hero Section */}
              <section id="section-hero" className="fade-in-on-scroll mb-12">
                <AboutHero
                  name={ownerName}
                  briefBio={welcomeData?.briefBio}
                  contactData={contactData}
                  professionalSummary={
                    serializedData?.professionalSummary || ""
                  }
                />
              </section>

              {/* Professional Summary */}
              <section id="section-summary" className="fade-in-on-scroll mb-12">
                <ProfessionalSummary>
                  {serializedData?.professionalSummary || ""}
                </ProfessionalSummary>
              </section>

              {/* Technical Skills */}
              {serializedData?.technicalSkills &&
                Array.isArray(serializedData.technicalSkills) &&
                serializedData.technicalSkills.length > 0 && (
                  <section
                    id="section-skills"
                    className="fade-in-on-scroll mb-12"
                  >
                    <TechnicalSkills skills={serializedData.technicalSkills} />
                  </section>
                )}

              {/* Professional Experience */}
              {serializedData?.professionalExperience &&
                Array.isArray(serializedData.professionalExperience) &&
                serializedData.professionalExperience.length > 0 && (
                  <section
                    id="section-experience"
                    className="fade-in-on-scroll mb-12"
                  >
                    <ProfessionalExperience
                      experience={serializedData.professionalExperience}
                    />
                  </section>
                )}

              {/* Education */}
              {serializedData?.education &&
                Array.isArray(serializedData.education) &&
                serializedData.education.length > 0 && (
                  <section
                    id="section-education"
                    className="fade-in-on-scroll mb-12"
                  >
                    <Education education={serializedData.education} />
                  </section>
                )}

              {/* Technical Certifications */}
              {serializedData?.technicalCertifications &&
                Array.isArray(serializedData.technicalCertifications) &&
                serializedData.technicalCertifications.length > 0 && (
                  <section
                    id="section-certifications"
                    className="fade-in-on-scroll mb-12"
                  >
                    <TechnicalCertifications
                      certifications={serializedData.technicalCertifications}
                    />
                  </section>
                )}

              {/* Leadership Experience */}
              {serializedData?.leadershipExperience &&
                Array.isArray(serializedData.leadershipExperience) &&
                serializedData.leadershipExperience.length > 0 && (
                  <section
                    id="section-leadership"
                    className="fade-in-on-scroll mb-12"
                  >
                    <LeadershipExperience
                      experience={serializedData.leadershipExperience}
                      subtitle={serializedData.leadershipSubtitle || ""}
                    />
                  </section>
                )}

              {/* Professional Development */}
              {serializedData?.professionalDevelopment &&
                Array.isArray(serializedData.professionalDevelopment) &&
                serializedData.professionalDevelopment.length > 0 && (
                  <section
                    id="section-development"
                    className="fade-in-on-scroll mb-12"
                  >
                    <ProfessionalDevelopment
                      development={serializedData.professionalDevelopment}
                    />
                  </section>
                )}

              {/* Hobbies */}
              {serializedData?.hobbies &&
                Array.isArray(serializedData.hobbies) &&
                serializedData.hobbies.length > 0 && (
                  <section
                    id="section-hobbies"
                    className="fade-in-on-scroll mb-12"
                  >
                    <Hobbies hobbies={serializedData.hobbies} />
                  </section>
                )}
            </div>

            {/* Table of Contents Sidebar */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <TableOfContents activeSection={activeSection} />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export async function getStaticProps() {
  try {
    const [aboutData, welcomeData, contactData, siteSettings] = await Promise.all([
      prisma.about.findFirst({
        orderBy: { createdAt: "desc" },
      }),
      prisma.welcome.findFirst({
        orderBy: { createdAt: "desc" },
      }),
      prisma.contact.findFirst({
        orderBy: { createdAt: "desc" },
      }),
      prisma.siteSettings.findFirst({
        select: { ownerName: true },
      }),
    ]);

    if (!aboutData) {
      return {
        notFound: true,
      };
    }

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

    // Social links come only from Contact settings (single source of truth)
    const serializedContactData = contactData
      ? {
          ...contactData,
          createdAt: contactData.createdAt.toISOString(),
          updatedAt: contactData.updatedAt.toISOString(),
        }
      : null;

    // Get owner name from site settings (global setting)
    const ownerName = siteSettings?.ownerName || null;

    return {
      props: {
        aboutData: serializedAboutData,
        welcomeData: serializedWelcomeData,
        contactData: serializedContactData,
        ownerName,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error fetching about page data:", error);
    return {
      notFound: true,
    };
  }
}

export default AboutPage;
