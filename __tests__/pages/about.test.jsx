/**
 * Tests for About page
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AboutPage, { getStaticProps } from "@/pages/about";

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Prisma - use the actual mock from __mocks__
import prisma from "@/lib/prisma";
jest.mock("@/lib/prisma");

describe("AboutPage", () => {
  const mockAboutData = {
    professionalSummary: "Experienced full stack developer",
    technicalSkills: [
      { category: "Languages", skills: ["JavaScript", "Python"] },
    ],
    experience: [
      {
        company: "Tech Corp",
        title: "Senior Developer",
        startYear: "2020",
        endYear: "2024",
      },
    ],
    education: [
      { degree: "BS in CS", institution: "MIT", graduationYear: "2020" },
    ],
    certifications: [
      { name: "AWS Solutions Architect" },
    ],
    leadership: [],
    professionalDevelopment: [],
    hobbies: ["Reading", "Gaming"],
  };

  const mockWelcomeData = {
    name: "Josh Lowe",
    tagline: "Full Stack Developer",
    briefBio: "Building great software",
  };

  const mockContactData = {
    email: "test@example.com",
    location: "San Francisco, CA",
    socials: { github: "https://github.com/jlowe" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders SEO component with page title", () => {
    render(
      <AboutPage
        aboutData={mockAboutData}
        welcomeData={mockWelcomeData}
        contactData={mockContactData}
        ownerName="Josh Lowe"
      />,
    );
    expect(document.title).toContain("About");
  });

  it("renders with null props", () => {
    render(
      <AboutPage aboutData={null} welcomeData={null} contactData={null} ownerName={null} />,
    );
    // Should render without crashing
    expect(document.body).toBeInTheDocument();
  });

  it("renders with empty aboutData", () => {
    render(
      <AboutPage aboutData={{}} welcomeData={mockWelcomeData} contactData={mockContactData} ownerName="Josh Lowe" />,
    );
    expect(document.body).toBeInTheDocument();
  });

  it("renders professional summary section", () => {
    render(
      <AboutPage
        aboutData={mockAboutData}
        welcomeData={mockWelcomeData}
        contactData={mockContactData}
        ownerName="Josh Lowe"
      />,
    );
    // The summary is passed to ProfessionalSummary component
    expect(screen.getByTestId("professional-summary-content")).toBeInTheDocument();
  });

  it("renders education section", () => {
    render(
      <AboutPage
        aboutData={mockAboutData}
        welcomeData={mockWelcomeData}
        contactData={mockContactData}
        ownerName="Josh Lowe"
      />,
    );
    // Multiple Education elements may exist (section header + table of contents link)
    const educationElements = screen.getAllByText("Education");
    expect(educationElements.length).toBeGreaterThan(0);
  });
});

describe("getStaticProps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns about data from database", async () => {
    const mockAbout = {
      id: "1",
      professionalSummary: "Test summary",
      technicalSkills: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockWelcome = { 
      name: "Test", 
      tagline: "Developer",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockContact = { 
      email: "test@test.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockSiteSettings = {
      ownerName: "Josh Lowe",
    };

    prisma.about.findFirst.mockResolvedValue(mockAbout);
    prisma.welcome.findFirst.mockResolvedValue(mockWelcome);
    prisma.contact.findFirst.mockResolvedValue(mockContact);
    prisma.siteSettings.findFirst.mockResolvedValue(mockSiteSettings);

    const result = await getStaticProps();

    expect(result.props.aboutData.professionalSummary).toBe("Test summary");
    expect(result.props.welcomeData.name).toBe("Test");
    expect(result.props.ownerName).toBe("Josh Lowe");
    expect(result.revalidate).toBe(60);
  });

  it("returns notFound when no about data exists", async () => {
    prisma.about.findFirst.mockResolvedValue(null);
    prisma.welcome.findFirst.mockResolvedValue(null);
    prisma.contact.findFirst.mockResolvedValue(null);
    prisma.siteSettings.findFirst.mockResolvedValue(null);

    const result = await getStaticProps();

    expect(result.notFound).toBe(true);
  });

  it("handles database errors gracefully", async () => {
    prisma.about.findFirst.mockRejectedValue(new Error("Database error"));

    const result = await getStaticProps();

    // Should return notFound or a fallback on error
    expect(result.notFound || result.props).toBeTruthy();
  });

  it("serializes dates correctly", async () => {
    const mockAbout = {
      id: "1",
      professionalSummary: "Summary",
      technicalSkills: [{ category: "Languages", skills: ["JS"] }],
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
    };

    prisma.about.findFirst.mockResolvedValue(mockAbout);
    prisma.welcome.findFirst.mockResolvedValue(null);
    prisma.contact.findFirst.mockResolvedValue(null);
    prisma.siteSettings.findFirst.mockResolvedValue(null);

    const result = await getStaticProps();

    expect(result.props.aboutData.technicalSkills).toHaveLength(1);
    expect(result.props.aboutData.technicalSkills[0].category).toBe("Languages");
    expect(typeof result.props.aboutData.createdAt).toBe("string");
  });

  it("returns null ownerName when no site settings", async () => {
    const mockAbout = {
      id: "1",
      professionalSummary: "Summary",
      technicalSkills: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prisma.about.findFirst.mockResolvedValue(mockAbout);
    prisma.welcome.findFirst.mockResolvedValue(null);
    prisma.contact.findFirst.mockResolvedValue(null);
    prisma.siteSettings.findFirst.mockResolvedValue(null);

    const result = await getStaticProps();

    expect(result.props.ownerName).toBeNull();
  });
});

