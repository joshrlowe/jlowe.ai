/**
 * Tests for ProfessionalExperience component
 *
 * Tests:
 * - Display order: Role/Title first, Organization/Company, Timeline, Description
 * - Markdown rendering for descriptions
 * - Conditional rendering for optional fields
 * - Snapshot tests for structure verification
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import ProfessionalExperience from "@/components/About/ProfessionalExperience/ProfessionalExperience";

// Mock MarkdownContent component
jest.mock("@/components/ui", () => ({
  MarkdownContent: ({ content, variant, testId }) => (
    <div data-testid={testId || "mock-markdown-content"} data-variant={variant}>
      {content}
    </div>
  ),
}));

describe("ProfessionalExperience", () => {
  const mockExperience = [
    {
      role: "Senior Software Engineer",
      company: "Tech Corp",
      startDate: "2022-01-01",
      endDate: "",
      isOngoing: true,
      description: "Led development of **core platform features** and mentored junior engineers.",
      location: "San Francisco, CA",
    },
    {
      role: "Software Engineer",
      company: "Startup Inc",
      startDate: "2019-06-15",
      endDate: "2021-12-31",
      isOngoing: false,
      description: "Built REST APIs and implemented CI/CD pipelines.",
    },
  ];

  describe("rendering", () => {
    it("should render nothing when experience array is empty", () => {
      const { container } = render(<ProfessionalExperience experience={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render nothing when experience is null", () => {
      const { container } = render(<ProfessionalExperience experience={null} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render nothing when experience is undefined", () => {
      const { container } = render(<ProfessionalExperience />);
      expect(container.firstChild).toBeNull();
    });

    it("should render the section title", () => {
      render(<ProfessionalExperience experience={mockExperience} />);
      expect(screen.getByText("Professional Experience")).toBeInTheDocument();
    });

    it("should render all experience entries", () => {
      render(<ProfessionalExperience experience={mockExperience} />);
      expect(screen.getByTestId("experience-entry-0")).toBeInTheDocument();
      expect(screen.getByTestId("experience-entry-1")).toBeInTheDocument();
    });
  });

  describe("display order", () => {
    it("should display Role/Title first in each entry", () => {
      render(<ProfessionalExperience experience={mockExperience} />);
      
      const entry0 = screen.getByTestId("experience-entry-0");
      const role = screen.getByTestId("experience-role-0");
      
      // Role should be an h3 element
      expect(role.tagName).toBe("H3");
      expect(role).toHaveTextContent("Senior Software Engineer");
      
      // Role should appear before company in DOM order
      const company = screen.getByTestId("experience-company-0");
      expect(entry0.innerHTML.indexOf("Senior Software Engineer")).toBeLessThan(
        entry0.innerHTML.indexOf("Tech Corp")
      );
    });

    it("should display Organization/Company after Role/Title", () => {
      render(<ProfessionalExperience experience={mockExperience} />);
      
      const company = screen.getByTestId("experience-company-0");
      expect(company.tagName).toBe("P");
      expect(company).toHaveTextContent("Tech Corp");
    });

    it("should display Timeline after Organization/Company", () => {
      render(<ProfessionalExperience experience={mockExperience} />);
      
      const entry0 = screen.getByTestId("experience-entry-0");
      const timeline = screen.getByTestId("experience-timeline-0");
      
      expect(timeline).toBeInTheDocument();
      // Timeline should appear after company
      expect(entry0.innerHTML.indexOf("Tech Corp")).toBeLessThan(
        entry0.innerHTML.indexOf("Present")
      );
    });

    it("should display Description after Timeline", () => {
      render(<ProfessionalExperience experience={mockExperience} />);
      
      const entry0 = screen.getByTestId("experience-entry-0");
      const description = screen.getByTestId("experience-description-0");
      
      expect(description).toBeInTheDocument();
      // Description should appear after timeline
      expect(entry0.innerHTML.indexOf("Present")).toBeLessThan(
        entry0.innerHTML.indexOf("core platform features")
      );
    });

    it("should have correct order: Role → Company → Timeline → Description", () => {
      render(<ProfessionalExperience experience={mockExperience} />);
      
      const entry0 = screen.getByTestId("experience-entry-0");
      const html = entry0.innerHTML;
      
      const roleIndex = html.indexOf("Senior Software Engineer");
      const companyIndex = html.indexOf("Tech Corp");
      const timelineIndex = html.indexOf("Present");
      const descriptionIndex = html.indexOf("core platform features");
      
      expect(roleIndex).toBeLessThan(companyIndex);
      expect(companyIndex).toBeLessThan(timelineIndex);
      expect(timelineIndex).toBeLessThan(descriptionIndex);
    });
  });

  describe("styling", () => {
    it("should render Role/Title as h3 with bold styling", () => {
      render(<ProfessionalExperience experience={mockExperience} />);
      
      const role = screen.getByTestId("experience-role-0");
      expect(role.tagName).toBe("H3");
      expect(role.className).toContain("font-bold");
      expect(role.className).toContain("text-xl");
    });

    it("should render Company with smaller styling than Role", () => {
      render(<ProfessionalExperience experience={mockExperience} />);
      
      const role = screen.getByTestId("experience-role-0");
      const company = screen.getByTestId("experience-company-0");
      
      // Role is text-xl, Company is text-base (smaller)
      expect(role.className).toContain("text-xl");
      expect(company.className).toContain("text-base");
    });

    it("should render Timeline with muted styling", () => {
      render(<ProfessionalExperience experience={mockExperience} />);
      
      const timeline = screen.getByTestId("experience-timeline-0");
      expect(timeline.className).toContain("text-sm");
      expect(timeline.className).toContain("text-[var(--color-text-muted)]");
    });
  });

  describe("markdown rendering", () => {
    it("should render description using MarkdownContent component", () => {
      render(<ProfessionalExperience experience={mockExperience} />);
      
      const descriptionWrapper = screen.getByTestId("experience-description-0");
      // The mocked MarkdownContent should be inside
      const markdownContent = descriptionWrapper.querySelector("[data-variant='compact']");
      expect(markdownContent).toBeInTheDocument();
    });

    it("should pass description content to MarkdownContent", () => {
      render(<ProfessionalExperience experience={mockExperience} />);
      
      const description = screen.getByTestId("experience-description-0");
      expect(description).toHaveTextContent("Led development of **core platform features**");
    });

    it("should use compact variant for description markdown", () => {
      render(<ProfessionalExperience experience={mockExperience} />);
      
      const descriptionWrapper = screen.getByTestId("experience-description-0");
      const markdownContent = descriptionWrapper.querySelector("[data-variant='compact']");
      expect(markdownContent).toHaveAttribute("data-variant", "compact");
    });
  });

  describe("conditional rendering", () => {
    it("should not render description section when description is empty", () => {
      const experienceWithoutDescription = [
        {
          role: "Developer",
          company: "No Desc Co",
          startDate: "2020-01-01",
          endDate: "2021-01-01",
        },
      ];
      
      render(<ProfessionalExperience experience={experienceWithoutDescription} />);
      expect(screen.queryByTestId("experience-description-0")).not.toBeInTheDocument();
    });

    it("should display 'Present' for ongoing positions", () => {
      render(<ProfessionalExperience experience={mockExperience} />);
      
      const timeline0 = screen.getByTestId("experience-timeline-0");
      expect(timeline0).toHaveTextContent("Present");
    });

    it("should display end date for completed positions", () => {
      render(<ProfessionalExperience experience={mockExperience} />);
      
      const timeline1 = screen.getByTestId("experience-timeline-1");
      expect(timeline1).toHaveTextContent("Dec 2021");
    });

    it("should display location when provided", () => {
      render(<ProfessionalExperience experience={mockExperience} />);
      
      const timeline0 = screen.getByTestId("experience-timeline-0");
      expect(timeline0).toHaveTextContent("San Francisco, CA");
    });
  });

  describe("date formatting", () => {
    it("should format ISO dates to readable format", () => {
      render(<ProfessionalExperience experience={mockExperience} />);
      
      // 2022-01-01 should become "Jan 2022"
      const timeline0 = screen.getByTestId("experience-timeline-0");
      expect(timeline0).toHaveTextContent("Jan 2022");
    });

    it("should preserve already formatted dates", () => {
      const experienceWithFormattedDates = [
        {
          role: "Developer",
          company: "Test Co",
          startDate: "Jan 2020",
          endDate: "Dec 2021",
        },
      ];
      
      render(<ProfessionalExperience experience={experienceWithFormattedDates} />);
      const timeline = screen.getByTestId("experience-timeline-0");
      expect(timeline).toHaveTextContent("Jan 2020");
      expect(timeline).toHaveTextContent("Dec 2021");
    });
  });

  describe("field aliases", () => {
    it("should support 'title' as alias for 'role'", () => {
      const experienceWithTitle = [
        {
          title: "Lead Developer",
          company: "Alias Co",
          startDate: "2020-01-01",
        },
      ];
      
      render(<ProfessionalExperience experience={experienceWithTitle} />);
      expect(screen.getByTestId("experience-role-0")).toHaveTextContent("Lead Developer");
    });

    it("should support 'position' as alias for 'role'", () => {
      const experienceWithPosition = [
        {
          position: "Staff Engineer",
          company: "Position Co",
          startDate: "2020-01-01",
        },
      ];
      
      render(<ProfessionalExperience experience={experienceWithPosition} />);
      expect(screen.getByTestId("experience-role-0")).toHaveTextContent("Staff Engineer");
    });

    it("should support 'organization' as alias for 'company'", () => {
      const experienceWithOrg = [
        {
          role: "Developer",
          organization: "Org Name",
          startDate: "2020-01-01",
        },
      ];
      
      render(<ProfessionalExperience experience={experienceWithOrg} />);
      expect(screen.getByTestId("experience-company-0")).toHaveTextContent("Org Name");
    });
  });

  describe("snapshots", () => {
    it("should match snapshot for single experience entry", () => {
      const singleExperience = [
        {
          role: "Software Engineer",
          company: "Snapshot Co",
          startDate: "2021-01-01",
          endDate: "2022-12-31",
          description: "Built **amazing** things.",
        },
      ];
      
      const { container } = render(
        <ProfessionalExperience experience={singleExperience} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it("should match snapshot for multiple experience entries", () => {
      const { container } = render(
        <ProfessionalExperience experience={mockExperience} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it("should match snapshot for entry without optional fields", () => {
      const minimalExperience = [
        {
          role: "Intern",
          company: "Minimal Co",
          startDate: "2020-01-01",
        },
      ];
      
      const { container } = render(
        <ProfessionalExperience experience={minimalExperience} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

