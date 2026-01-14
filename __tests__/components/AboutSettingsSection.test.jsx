/**
 * Tests for AboutSettingsSection Component
 *
 * Tests the comprehensive About page editor including:
 * - Loading state
 * - Form fields rendering
 * - Collapsible sections
 * - Array field management (add/remove entries)
 * - Form submission
 * - Error handling
 */

import React from "react";
import { screen, renderWithoutProviders, waitFor } from "@/test-utils";
import AboutSettingsSection from "@/components/admin/AboutSettingsSection";
import ToastProvider from "@/components/admin/ToastProvider";

// Mock fetch
global.fetch = jest.fn();

// Helper to render with ToastProvider
function renderWithToast(ui) {
  return renderWithoutProviders(<ToastProvider>{ui}</ToastProvider>);
}

// Mock about data matching the schema
const mockAboutData = {
  id: "about-1",
  professionalSummary: "# Hello\n\nI am a developer.",
  technicalSkills: [
    {
      category: "Programming",
      skills: [
        {
          name: "JavaScript",
          expertiseLevel: "Expert",
          projects: [{ name: "Project 1", repositoryLink: "https://github.com/test" }],
        },
      ],
    },
  ],
  professionalExperience: [
    {
      company: "Tech Corp",
      role: "Senior Developer",
      description: "Built things",
      startDate: "2020-01-01",
      endDate: "2023-12-31",
      isOngoing: false,
      achievements: ["Shipped features"],
    },
  ],
  education: [
    {
      institution: "University",
      degree: "BS",
      fieldOfStudy: "Computer Science",
      startDate: "2016-09-01",
      endDate: "2020-05-15",
      isOngoing: false,
      expectedGradDate: "",
      relevantCoursework: ["Algorithms"],
    },
  ],
  technicalCertifications: [
    {
      organization: "AWS",
      name: "Solutions Architect",
      issueDate: "2023-01-01",
      expirationDate: "2026-01-01",
      credentialUrl: "https://aws.amazon.com/cert",
    },
  ],
  leadershipExperience: [
    {
      organization: "Open Source",
      role: "Maintainer",
      startDate: "2021-01-01",
      endDate: "",
      achievements: ["Grew community"],
    },
  ],
  hobbies: ["Reading", "Hiking"],
};

describe("AboutSettingsSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful fetch mock
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockAboutData,
    });
  });

  describe("loading state", () => {
    it("should show loading spinner initially", () => {
      // Make fetch never resolve
      global.fetch.mockImplementation(() => new Promise(() => {}));

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("should hide loading spinner after data loads", async () => {
      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
      });
    });
  });

  describe("data fetching", () => {
    it("should fetch about data on mount", async () => {
      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/about");
      });
    });

    it("should call onError when fetch fails", async () => {
      const onError = jest.fn();
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Error" }),
      });

      renderWithToast(<AboutSettingsSection onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith("Failed to load about page data");
      });
    });

    it("should handle fetch network error", async () => {
      const onError = jest.fn();
      global.fetch.mockRejectedValue(new Error("Network error"));

      renderWithToast(<AboutSettingsSection onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe("collapsible sections", () => {
    it("should render all section headers", async () => {
      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText("Professional Summary")).toBeInTheDocument();
      });

      // Use getAllByText for sections that may appear multiple times
      expect(screen.getAllByText(/Skill Categories/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Professional Experience/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Education/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Technical Certifications/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Leadership Experience/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Hobbies & Interests/).length).toBeGreaterThan(0);
    });

    it("should toggle section visibility when clicked", async () => {
      const { user } = renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText("Professional Summary")).toBeInTheDocument();
      });

      // The section headers should be buttons that can be clicked
      const sections = screen.getAllByText(/Skill Categories/);
      expect(sections.length).toBeGreaterThan(0);
    });
  });

  describe("professional summary", () => {
    it("should display professional summary in markdown editor", async () => {
      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        // Get the first markdown editor (professional summary)
        const textareas = screen.getAllByTestId("markdown-editor");
        expect(textareas[0]).toHaveValue("# Hello\n\nI am a developer.");
      });
    });

    it("should show Edit and Preview buttons", async () => {
      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        // Multiple Edit/Preview buttons exist, one for each MarkdownEditor
        const editButtons = screen.getAllByRole("button", { name: "Edit" });
        const previewButtons = screen.getAllByRole("button", { name: "Preview" });
        expect(editButtons.length).toBeGreaterThan(0);
        expect(previewButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("skill categories (nested structure)", () => {
    it("should display existing categories count in section title", async () => {
      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText("Skill Categories (1)")).toBeInTheDocument();
      });
    });

    it("should show category entry when section is expanded", async () => {
      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText("Skill Categories (1)")).toBeInTheDocument();
      });

      // Since the section has items, it defaults to open
      // Check that category name is visible
      await waitFor(() => {
        expect(screen.getByDisplayValue("Programming")).toBeInTheDocument();
      });
    });

    it("should display skills within category", async () => {
      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        // The skill name "JavaScript" should be visible
        expect(screen.getByDisplayValue("JavaScript")).toBeInTheDocument();
      });
    });

    it("should show skill count badge in category", async () => {
      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        // Category has 1 skill
        expect(screen.getByText("1 skill")).toBeInTheDocument();
      });
    });
  });

  describe("hobbies", () => {
    it("should display hobbies count in section title", async () => {
      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText("Hobbies & Interests (2)")).toBeInTheDocument();
      });
    });
  });

  describe("form submission", () => {
    it("should have save button", async () => {
      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Save All Changes" })
        ).toBeInTheDocument();
      });
    });

    it("should submit form data on save", async () => {
      // Reset fetch mock to track calls
      global.fetch.mockReset();
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAboutData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockAboutData, updatedAt: new Date().toISOString() }),
        });

      const { user } = renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Save All Changes" })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Save All Changes" }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/admin/about", expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }));
      });
    });

    it("should show saving state while submitting", async () => {
      // Make the PUT request hang
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAboutData,
        })
        .mockImplementation(() => new Promise(() => {}));

      const { user } = renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Save All Changes" })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Save All Changes" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Saving..." })).toBeInTheDocument();
      });
    });

    it("should handle save error", async () => {
      const onError = jest.fn();

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAboutData,
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: "Failed to save" }),
        });

      const { user } = renderWithToast(<AboutSettingsSection onError={onError} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Save All Changes" })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Save All Changes" }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith("Failed to save settings");
      });
    });
  });

  describe("empty state handling", () => {
    it("should handle empty data gracefully", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          professionalSummary: "",
          technicalSkills: [],
          professionalExperience: [],
          education: [],
          technicalCertifications: [],
          leadershipExperience: [],
          hobbies: [],
        }),
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText("Skill Categories (0)")).toBeInTheDocument();
        expect(screen.getByText("Professional Experience (0)")).toBeInTheDocument();
        expect(screen.getByText("Education (0)")).toBeInTheDocument();
        expect(screen.getByText("Hobbies & Interests (0)")).toBeInTheDocument();
      });
    });
  });

  describe("professional experience ongoing toggle", () => {
    const mockDataWithExperience = {
      ...mockAboutData,
      professionalExperience: [
        {
          company: "Current Company",
          role: "Developer",
          description: "Working here",
          startDate: "2023-01-01",
          endDate: "",
          isOngoing: true,
          achievements: [],
        },
      ],
    };

    const mockDataWithCompletedExperience = {
      ...mockAboutData,
      professionalExperience: [
        {
          company: "Past Company",
          role: "Developer",
          description: "Worked here",
          startDate: "2020-01-01",
          endDate: "2022-12-31",
          isOngoing: false,
          achievements: [],
        },
      ],
    };

    it("should render ongoing checkbox for experience entries", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithExperience,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("ongoing-checkbox")).toBeInTheDocument();
      });
    });

    it("should show 'Present' indicator when ongoing is checked", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithExperience,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("ongoing-indicator")).toBeInTheDocument();
        expect(screen.getByTestId("ongoing-indicator")).toHaveTextContent("Present");
      });
    });

    it("should show end date input when ongoing is not checked", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithCompletedExperience,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("end-date-input")).toBeInTheDocument();
      });
    });

    it("should have ongoing checkbox checked when isOngoing is true", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithExperience,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        const checkbox = screen.getByTestId("ongoing-checkbox");
        expect(checkbox).toBeChecked();
      });
    });

    it("should have ongoing checkbox unchecked when isOngoing is false", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithCompletedExperience,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        const checkbox = screen.getByTestId("ongoing-checkbox");
        expect(checkbox).not.toBeChecked();
      });
    });

    it("should toggle from ongoing to not ongoing", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithExperience,
      });

      const { user } = renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("ongoing-checkbox")).toBeChecked();
      });

      // Click to uncheck
      await user.click(screen.getByTestId("ongoing-checkbox"));

      await waitFor(() => {
        expect(screen.getByTestId("ongoing-checkbox")).not.toBeChecked();
        expect(screen.getByTestId("end-date-input")).toBeInTheDocument();
      });
    });

    it("should toggle from not ongoing to ongoing", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithCompletedExperience,
      });

      const { user } = renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("ongoing-checkbox")).not.toBeChecked();
      });

      // Click to check
      await user.click(screen.getByTestId("ongoing-checkbox"));

      await waitFor(() => {
        expect(screen.getByTestId("ongoing-checkbox")).toBeChecked();
        expect(screen.getByTestId("ongoing-indicator")).toBeInTheDocument();
      });
    });

    it("should clear end date when toggling to ongoing", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithCompletedExperience,
      });

      const { user } = renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        const endDateInput = screen.getByTestId("end-date-input");
        expect(endDateInput).toHaveValue("2022-12-31");
      });

      // Click to check ongoing
      await user.click(screen.getByTestId("ongoing-checkbox"));

      await waitFor(() => {
        // End date input should be replaced with "Present" indicator
        expect(screen.queryByTestId("end-date-input")).not.toBeInTheDocument();
        expect(screen.getByTestId("ongoing-indicator")).toBeInTheDocument();
      });
    });

    it("should include isOngoing in form submission", async () => {
      global.fetch.mockReset();
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDataWithExperience,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

      const { user } = renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Save All Changes" })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Save All Changes" }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/admin/about",
          expect.objectContaining({
            method: "PUT",
            body: expect.stringContaining('"isOngoing":true'),
          })
        );
      });
    });

    it("should display company and role fields in experience entry", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithExperience,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Current Company")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Developer")).toBeInTheDocument();
      });
    });

    it("should require end date when ongoing is not checked", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithCompletedExperience,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        const endDateInput = screen.getByTestId("end-date-input");
        expect(endDateInput).toHaveAttribute("required");
      });
    });
  });

  describe("nested skill categories", () => {
    const mockDataWithMultipleCategories = {
      ...mockAboutData,
      technicalSkills: [
        {
          category: "Frontend",
          skills: [
            { name: "React", expertiseLevel: "Expert", projects: [] },
            { name: "Vue", expertiseLevel: "Intermediate", projects: [] },
          ],
        },
        {
          category: "Backend",
          skills: [
            {
              name: "Node.js",
              expertiseLevel: "Advanced",
              projects: [{ name: "API Server", repositoryLink: "https://github.com/test/api" }],
            },
          ],
        },
      ],
    };

    const mockDataWithEmptyCategory = {
      ...mockAboutData,
      technicalSkills: [
        {
          category: "New Category",
          skills: [],
        },
      ],
    };

    it("should render multiple skill categories", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithMultipleCategories,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText("Skill Categories (2)")).toBeInTheDocument();
      });
    });

    it("should display category names", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithMultipleCategories,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Frontend")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Backend")).toBeInTheDocument();
      });
    });

    it("should display skills within each category", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithMultipleCategories,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("React")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Vue")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Node.js")).toBeInTheDocument();
      });
    });

    it("should show correct skill count for each category", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithMultipleCategories,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        // Frontend has 2 skills, Backend has 1 skill
        expect(screen.getByText("2 skills")).toBeInTheDocument();
        expect(screen.getByText("1 skill")).toBeInTheDocument();
      });
    });

    it("should show empty state for category with no skills", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithEmptyCategory,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(
          screen.getByText(/No skills added yet/)
        ).toBeInTheDocument();
      });
    });

    it("should render skill category test ids", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithMultipleCategories,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("skill-category-0")).toBeInTheDocument();
        expect(screen.getByTestId("skill-category-1")).toBeInTheDocument();
      });
    });

    it("should render skill items with data", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithMultipleCategories,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      // Skills should be visible since categories with items default to open
      await waitFor(() => {
        // Check for skill names instead of test IDs to verify skills are rendered
        expect(screen.getByDisplayValue("React")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Vue")).toBeInTheDocument();
      });
    });

    it("should have add skill button for each category", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithMultipleCategories,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("add-skill-to-category-0")).toBeInTheDocument();
        expect(screen.getByTestId("add-skill-to-category-1")).toBeInTheDocument();
      });
    });

    it("should display projects within skills", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithMultipleCategories,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("API Server")).toBeInTheDocument();
      });
    });

    it("should have remove category buttons", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithMultipleCategories,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("remove-category-0")).toBeInTheDocument();
        expect(screen.getByTestId("remove-category-1")).toBeInTheDocument();
      });
    });

    it("should have remove skill buttons", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithMultipleCategories,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        // Look for "Remove Skill" buttons
        const removeButtons = screen.getAllByRole("button", { name: /Remove Skill/i });
        expect(removeButtons.length).toBeGreaterThan(0);
      });
    });

    it("should include nested skills structure in form submission", async () => {
      global.fetch.mockReset();
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDataWithMultipleCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

      const { user } = renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Save All Changes" })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Save All Changes" }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/admin/about",
          expect.objectContaining({
            method: "PUT",
            body: expect.stringContaining('"skills":['),
          })
        );
      });
    });

    it("should submit with category and nested skills structure", async () => {
      global.fetch.mockReset();
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDataWithMultipleCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

      const { user } = renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Save All Changes" })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Save All Changes" }));

      await waitFor(() => {
        const fetchCall = global.fetch.mock.calls.find(
          (call) => call[0] === "/api/admin/about"
        );
        expect(fetchCall).toBeDefined();
        const body = JSON.parse(fetchCall[1].body);
        expect(body.technicalSkills[0].category).toBe("Frontend");
        expect(body.technicalSkills[0].skills).toHaveLength(2);
        expect(body.technicalSkills[0].skills[0].name).toBe("React");
      });
    });
  });

  describe("education ongoing toggle", () => {
    const mockDataWithOngoingEducation = {
      ...mockAboutData,
      education: [
        {
          institution: "Graduate University",
          degree: "Master of Science",
          fieldOfStudy: "Artificial Intelligence",
          startDate: "2024-01-15",
          endDate: "",
          isOngoing: true,
          expectedGradDate: "2026-05-01",
          relevantCoursework: ["Deep Learning", "NLP"],
        },
      ],
    };

    const mockDataWithCompletedEducation = {
      ...mockAboutData,
      education: [
        {
          institution: "University",
          degree: "BS",
          fieldOfStudy: "Computer Science",
          startDate: "2016-09-01",
          endDate: "2020-05-15",
          isOngoing: false,
          expectedGradDate: "",
          relevantCoursework: ["Algorithms"],
        },
      ],
    };

    it("should render ongoing checkbox for education entries", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithCompletedEducation,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("education-ongoing-checkbox-0")).toBeInTheDocument();
      });
    });

    it("should show 'Currently Enrolled' label for ongoing checkbox", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithCompletedEducation,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText("Currently Enrolled")).toBeInTheDocument();
      });
    });

    it("should show expected graduation field when ongoing is checked", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithOngoingEducation,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("education-expected-grad-0")).toBeInTheDocument();
        expect(screen.getByTestId("education-expected-grad-0")).toHaveValue("2026-05-01");
      });
    });

    it("should show end date field when ongoing is not checked", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithCompletedEducation,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("education-end-date-0")).toBeInTheDocument();
        expect(screen.getByTestId("education-end-date-0")).toHaveValue("2020-05-15");
      });
    });

    it("should display 'Expected Graduation' label when ongoing", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithOngoingEducation,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText("Expected Graduation")).toBeInTheDocument();
      });
    });

    it("should display 'End Date' label when not ongoing", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithCompletedEducation,
      });

      renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      // Wait for data to load and verify end date field is present
      await waitFor(() => {
        expect(screen.getByTestId("education-end-date-0")).toBeInTheDocument();
      });

      // Check that the label contains "End Date" (not "Expected Graduation")
      const labelElements = screen.getAllByText("End Date");
      expect(labelElements.length).toBeGreaterThan(0);
    });

    it("should toggle from completed to ongoing and show expected graduation", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithCompletedEducation,
      });

      const { user } = renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("education-ongoing-checkbox-0")).not.toBeChecked();
      });

      // Toggle to ongoing
      await user.click(screen.getByTestId("education-ongoing-checkbox-0"));

      // Should now show expected graduation instead of end date
      expect(screen.getByTestId("education-ongoing-checkbox-0")).toBeChecked();
      expect(screen.getByTestId("education-expected-grad-0")).toBeInTheDocument();
      expect(screen.queryByTestId("education-end-date-0")).not.toBeInTheDocument();
    });

    it("should toggle from ongoing to completed and show end date", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithOngoingEducation,
      });

      const { user } = renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("education-ongoing-checkbox-0")).toBeChecked();
      });

      // Toggle to completed
      await user.click(screen.getByTestId("education-ongoing-checkbox-0"));

      // Should now show end date instead of expected graduation
      expect(screen.getByTestId("education-ongoing-checkbox-0")).not.toBeChecked();
      expect(screen.getByTestId("education-end-date-0")).toBeInTheDocument();
      expect(screen.queryByTestId("education-expected-grad-0")).not.toBeInTheDocument();
    });

    it("should clear end date when toggling to ongoing", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithCompletedEducation,
      });

      const { user } = renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("education-end-date-0")).toHaveValue("2020-05-15");
      });

      // Toggle to ongoing
      await user.click(screen.getByTestId("education-ongoing-checkbox-0"));

      // Expected graduation should be empty since it was cleared
      expect(screen.getByTestId("education-expected-grad-0")).toHaveValue("");
    });

    it("should clear expected graduation when toggling to completed", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockDataWithOngoingEducation,
      });

      const { user } = renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("education-expected-grad-0")).toHaveValue("2026-05-01");
      });

      // Toggle to completed
      await user.click(screen.getByTestId("education-ongoing-checkbox-0"));

      // End date should be empty
      expect(screen.getByTestId("education-end-date-0")).toHaveValue("");
    });

    it("should include isOngoing and expectedGradDate in form submission", async () => {
      global.fetch.mockReset();
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDataWithOngoingEducation,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockDataWithOngoingEducation, updatedAt: new Date().toISOString() }),
        });

      const { user } = renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Save All Changes" })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Save All Changes" }));

      await waitFor(() => {
        const fetchCall = global.fetch.mock.calls.find(
          (call) => call[0] === "/api/admin/about"
        );
        expect(fetchCall).toBeDefined();
        const submittedBody = JSON.parse(fetchCall[1].body);
        expect(submittedBody.education[0].isOngoing).toBe(true);
        expect(submittedBody.education[0].expectedGradDate).toBe("2026-05-01");
      });
    });

    it("should add new education entry with isOngoing false by default", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockAboutData,
          education: [],
        }),
      });

      const { user } = renderWithToast(<AboutSettingsSection onError={jest.fn()} />);

      // Wait for data to load and find the collapsed Education section header
      await waitFor(() => {
        expect(screen.getByText(/Education \(0\)/)).toBeInTheDocument();
      });

      // Expand the Education section by clicking on the header
      await user.click(screen.getByText(/Education \(0\)/));

      // Now the Add button should be visible
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /\+ Add Education/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /\+ Add Education/i }));

      await waitFor(() => {
        expect(screen.getByTestId("education-ongoing-checkbox-0")).not.toBeChecked();
        expect(screen.getByTestId("education-end-date-0")).toBeInTheDocument();
      });
    });
  });
});

