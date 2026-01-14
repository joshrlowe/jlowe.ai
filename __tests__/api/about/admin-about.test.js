/**
 * Tests for Admin About API
 *
 * Tests PUT /api/admin/about endpoint:
 * - Authentication requirement
 * - Validation
 * - Successful updates
 * - Error handling
 */

import {
  createMockRequest,
  createMockResponse,
  getJsonResponse,
  getStatusCode,
} from "@/__tests__/setup/api-test-utils";
import handler from "@/pages/api/admin/about";

// Mock next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock authOptions
jest.mock("@/pages/api/auth/[...nextauth]", () => ({
  authOptions: {},
}));

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    about: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

describe("/api/admin/about", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("authentication", () => {
    it("should return 401 when not authenticated", async () => {
      getServerSession.mockResolvedValue(null);

      const req = createMockRequest({
        method: "PUT",
        body: { professionalSummary: "Test" },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(getStatusCode(res)).toBe(401);
      expect(getJsonResponse(res)).toEqual({ message: "Unauthorized" });
    });

    it("should allow request when authenticated", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });
      prisma.about.deleteMany.mockResolvedValue({});
      prisma.about.create.mockResolvedValue({
        id: "about-1",
        professionalSummary: "Test",
      });

      const req = createMockRequest({
        method: "PUT",
        body: {
          professionalSummary: "Test",
          technicalSkills: [],
          professionalExperience: [],
          education: [],
          technicalCertifications: [],
          leadershipExperience: [],
          hobbies: [],
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(getStatusCode(res)).toBe(200);
    });
  });

  describe("HTTP methods", () => {
    it("should return 405 for GET requests", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });

      const req = createMockRequest({ method: "GET" });
      const res = createMockResponse();
      res.setHeader = jest.fn();

      await handler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res)).toEqual({
        message: "Method GET not allowed",
      });
    });

    it("should return 405 for POST requests", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });

      const req = createMockRequest({
        method: "POST",
        body: { professionalSummary: "Test" },
      });
      const res = createMockResponse();
      res.setHeader = jest.fn();

      await handler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res)).toEqual({
        message: "Method POST not allowed",
      });
    });

    it("should return 405 for DELETE requests", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });

      const req = createMockRequest({ method: "DELETE" });
      const res = createMockResponse();
      res.setHeader = jest.fn();

      await handler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });

  describe("validation", () => {
    it("should return 400 when professionalSummary is missing", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });

      const req = createMockRequest({
        method: "PUT",
        body: {
          technicalSkills: [],
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res)).toEqual({
        message: "Professional summary is required",
      });
    });

    it("should return 400 when professionalSummary is empty string", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });

      const req = createMockRequest({
        method: "PUT",
        body: {
          professionalSummary: "",
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(getStatusCode(res)).toBe(400);
    });

    it("should return 400 when professionalSummary is not a string", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });

      const req = createMockRequest({
        method: "PUT",
        body: {
          professionalSummary: 123,
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(getStatusCode(res)).toBe(400);
    });
  });

  describe("successful update", () => {
    const validBody = {
      professionalSummary: "# About Me\n\nI am a developer.",
      technicalSkills: [
        {
          category: "Languages",
          skillName: "JavaScript",
          expertiseLevel: "Expert",
          projects: [],
        },
      ],
      professionalExperience: [
        {
          company: "Tech Corp",
          role: "Developer",
          description: "Built things",
          startDate: "2020-01-01",
          endDate: "",
          isOngoing: true,
          achievements: ["Shipped features"],
        },
      ],
      education: [
        {
          institution: "University",
          degree: "BS",
          fieldOfStudy: "CS",
          startDate: "2016-01-01",
          endDate: "2020-01-01",
          relevantCoursework: ["Algorithms"],
        },
      ],
      technicalCertifications: [
        {
          organization: "AWS",
          name: "SAA",
          issueDate: "2023-01-01",
          expirationDate: "2026-01-01",
          credentialUrl: "https://aws.com",
        },
      ],
      leadershipExperience: [],
      hobbies: ["Reading", "Hiking"],
    };

    it("should delete existing about data before creating new", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });
      prisma.about.deleteMany.mockResolvedValue({ count: 1 });
      prisma.about.create.mockResolvedValue({ id: "about-1", ...validBody });

      const req = createMockRequest({
        method: "PUT",
        body: validBody,
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(prisma.about.deleteMany).toHaveBeenCalledWith({});
    });

    it("should create new about record with all fields", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });
      prisma.about.deleteMany.mockResolvedValue({});
      prisma.about.create.mockResolvedValue({ id: "about-1", ...validBody });

      const req = createMockRequest({
        method: "PUT",
        body: validBody,
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(prisma.about.create).toHaveBeenCalledWith({
        data: {
          professionalSummary: validBody.professionalSummary,
          technicalSkills: validBody.technicalSkills,
          professionalExperience: validBody.professionalExperience,
          education: validBody.education,
          technicalCertifications: validBody.technicalCertifications,
          leadershipExperience: validBody.leadershipExperience,
          hobbies: validBody.hobbies,
        },
      });
    });

    it("should return 200 with created about data", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });
      prisma.about.deleteMany.mockResolvedValue({});
      prisma.about.create.mockResolvedValue({ id: "about-1", ...validBody });

      const req = createMockRequest({
        method: "PUT",
        body: validBody,
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(getStatusCode(res)).toBe(200);
      expect(getJsonResponse(res)).toEqual({ id: "about-1", ...validBody });
    });

    it("should default empty arrays for missing optional fields", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });
      prisma.about.deleteMany.mockResolvedValue({});
      prisma.about.create.mockResolvedValue({
        id: "about-1",
        professionalSummary: "Test",
        technicalSkills: [],
        professionalExperience: [],
        education: [],
        technicalCertifications: [],
        leadershipExperience: [],
        hobbies: [],
      });

      const req = createMockRequest({
        method: "PUT",
        body: {
          professionalSummary: "Test",
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(prisma.about.create).toHaveBeenCalledWith({
        data: {
          professionalSummary: "Test",
          technicalSkills: [],
          professionalExperience: [],
          education: [],
          technicalCertifications: [],
          leadershipExperience: [],
          hobbies: [],
        },
      });
    });
  });

  describe("error handling", () => {
    it("should return 500 when prisma throws error", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });
      prisma.about.deleteMany.mockRejectedValue(new Error("Database error"));

      const req = createMockRequest({
        method: "PUT",
        body: {
          professionalSummary: "Test",
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(getStatusCode(res)).toBe(500);
      expect(getJsonResponse(res)).toEqual({
        message: "Failed to update about content",
      });
    });

    it("should return 500 when create fails", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });
      prisma.about.deleteMany.mockResolvedValue({});
      prisma.about.create.mockRejectedValue(new Error("Create failed"));

      const req = createMockRequest({
        method: "PUT",
        body: {
          professionalSummary: "Test",
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe("markdown content", () => {
    it("should preserve markdown formatting in summary", async () => {
      const markdownContent = `# Professional Summary

## Experience
I have 10+ years of experience.

### Skills
- JavaScript
- Python
- **Leadership**

\`\`\`javascript
const skills = ['js', 'py'];
\`\`\`
`;

      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });
      prisma.about.deleteMany.mockResolvedValue({});
      prisma.about.create.mockResolvedValue({
        id: "about-1",
        professionalSummary: markdownContent,
      });

      const req = createMockRequest({
        method: "PUT",
        body: {
          professionalSummary: markdownContent,
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(prisma.about.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            professionalSummary: markdownContent,
          }),
        })
      );
    });
  });

  describe("professional experience with isOngoing", () => {
    it("should save isOngoing field for ongoing experience", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });
      prisma.about.deleteMany.mockResolvedValue({});
      prisma.about.create.mockResolvedValue({
        id: "about-1",
        professionalSummary: "Test",
        professionalExperience: [
          {
            company: "Current Company",
            role: "Developer",
            startDate: "2023-01-01",
            endDate: "",
            isOngoing: true,
          },
        ],
      });

      const req = createMockRequest({
        method: "PUT",
        body: {
          professionalSummary: "Test",
          professionalExperience: [
            {
              company: "Current Company",
              role: "Developer",
              startDate: "2023-01-01",
              endDate: "",
              isOngoing: true,
            },
          ],
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(prisma.about.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            professionalExperience: expect.arrayContaining([
              expect.objectContaining({
                isOngoing: true,
              }),
            ]),
          }),
        })
      );
    });

    it("should save isOngoing as false for completed experience", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });
      prisma.about.deleteMany.mockResolvedValue({});
      prisma.about.create.mockResolvedValue({
        id: "about-1",
        professionalSummary: "Test",
        professionalExperience: [
          {
            company: "Past Company",
            role: "Developer",
            startDate: "2020-01-01",
            endDate: "2022-12-31",
            isOngoing: false,
          },
        ],
      });

      const req = createMockRequest({
        method: "PUT",
        body: {
          professionalSummary: "Test",
          professionalExperience: [
            {
              company: "Past Company",
              role: "Developer",
              startDate: "2020-01-01",
              endDate: "2022-12-31",
              isOngoing: false,
            },
          ],
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(prisma.about.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            professionalExperience: expect.arrayContaining([
              expect.objectContaining({
                isOngoing: false,
                endDate: "2022-12-31",
              }),
            ]),
          }),
        })
      );
    });

    it("should handle multiple experiences with mixed isOngoing values", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });
      prisma.about.deleteMany.mockResolvedValue({});
      prisma.about.create.mockResolvedValue({ id: "about-1" });

      const experiences = [
        {
          company: "Current Job",
          role: "Senior Dev",
          startDate: "2023-01-01",
          endDate: "",
          isOngoing: true,
        },
        {
          company: "Previous Job",
          role: "Dev",
          startDate: "2020-01-01",
          endDate: "2022-12-31",
          isOngoing: false,
        },
      ];

      const req = createMockRequest({
        method: "PUT",
        body: {
          professionalSummary: "Test",
          professionalExperience: experiences,
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(prisma.about.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            professionalExperience: experiences,
          }),
        })
      );
    });
  });

  describe("education with isOngoing and expectedGradDate", () => {
    it("should save isOngoing and expectedGradDate for ongoing education", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });
      prisma.about.deleteMany.mockResolvedValue({});
      prisma.about.create.mockResolvedValue({ id: "about-1" });

      const req = createMockRequest({
        method: "PUT",
        body: {
          professionalSummary: "Test",
          education: [
            {
              institution: "Graduate University",
              degree: "MS",
              fieldOfStudy: "AI",
              startDate: "2024-01-01",
              endDate: "",
              isOngoing: true,
              expectedGradDate: "2026-05-15",
              relevantCoursework: ["Deep Learning"],
            },
          ],
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(prisma.about.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            education: expect.arrayContaining([
              expect.objectContaining({
                isOngoing: true,
                expectedGradDate: "2026-05-15",
              }),
            ]),
          }),
        })
      );
    });

    it("should save isOngoing as false for completed education", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });
      prisma.about.deleteMany.mockResolvedValue({});
      prisma.about.create.mockResolvedValue({ id: "about-1" });

      const req = createMockRequest({
        method: "PUT",
        body: {
          professionalSummary: "Test",
          education: [
            {
              institution: "University",
              degree: "BS",
              fieldOfStudy: "CS",
              startDate: "2016-09-01",
              endDate: "2020-05-15",
              isOngoing: false,
              expectedGradDate: "",
              relevantCoursework: ["Algorithms"],
            },
          ],
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(prisma.about.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            education: expect.arrayContaining([
              expect.objectContaining({
                isOngoing: false,
                endDate: "2020-05-15",
              }),
            ]),
          }),
        })
      );
    });

    it("should handle ongoing education with empty expectedGradDate", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });
      prisma.about.deleteMany.mockResolvedValue({});
      prisma.about.create.mockResolvedValue({ id: "about-1" });

      const req = createMockRequest({
        method: "PUT",
        body: {
          professionalSummary: "Test",
          education: [
            {
              institution: "Part-time University",
              degree: "PhD",
              fieldOfStudy: "Machine Learning",
              startDate: "2023-01-01",
              endDate: "",
              isOngoing: true,
              expectedGradDate: "",
              relevantCoursework: [],
            },
          ],
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(getStatusCode(res)).toBe(200);
      expect(prisma.about.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            education: expect.arrayContaining([
              expect.objectContaining({
                isOngoing: true,
                expectedGradDate: "",
              }),
            ]),
          }),
        })
      );
    });

    it("should handle multiple education entries with mixed isOngoing values", async () => {
      getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });
      prisma.about.deleteMany.mockResolvedValue({});
      prisma.about.create.mockResolvedValue({ id: "about-1" });

      const educationEntries = [
        {
          institution: "Graduate School",
          degree: "MS",
          fieldOfStudy: "AI",
          startDate: "2024-01-01",
          endDate: "",
          isOngoing: true,
          expectedGradDate: "2026-05-01",
          relevantCoursework: ["NLP"],
        },
        {
          institution: "Undergrad University",
          degree: "BS",
          fieldOfStudy: "CS",
          startDate: "2016-09-01",
          endDate: "2020-05-15",
          isOngoing: false,
          expectedGradDate: "",
          relevantCoursework: ["Algorithms", "Data Structures"],
        },
      ];

      const req = createMockRequest({
        method: "PUT",
        body: {
          professionalSummary: "Test",
          education: educationEntries,
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(prisma.about.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            education: educationEntries,
          }),
        })
      );
    });
  });
});
