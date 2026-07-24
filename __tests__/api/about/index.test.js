/**
 * Tests for /api/about/index
 *
 * Tests about page data API route
 */

import aboutHandler from "../../../pages/api/about/index";
import prisma from "../../../lib/prisma";
import {
  createMockRequest,
  createMockResponse,
  getJsonResponse,
  getStatusCode,
} from "../../setup/api-test-utils.js";

jest.mock("../../../lib/prisma", () => ({
  __esModule: true,
  default: {
    about: {
      findFirst: jest.fn(),
    },
  },
}));

describe("/api/about", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validAboutData = {
    professionalSummary: "AI/ML Engineer with 5+ years of experience",
    technicalSkills: ["Python", "TensorFlow", "React"],
    professionalExperience: [],
    education: [],
    technicalCertifications: [],
    leadershipExperience: [],
    hobbies: [],
  };

  describe("GET requests", () => {
    it("should return latest about data with 200", async () => {
      const mockAbout = {
        id: "1",
        ...validAboutData,
        createdAt: new Date(),
      };

      prisma.about.findFirst.mockResolvedValue(mockAbout);

      const req = createMockRequest({ method: "GET" });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(prisma.about.findFirst).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
      });
      expect(getStatusCode(res)).toBe(200);
      expect(getJsonResponse(res)).toEqual(mockAbout);
    });

    it("should return 404 when no about data exists", async () => {
      prisma.about.findFirst.mockResolvedValue(null);

      const req = createMockRequest({ method: "GET" });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(404);
      expect(getJsonResponse(res).message).toContain("About data not found");
    });

    it("should handle database errors with 500", async () => {
      prisma.about.findFirst.mockRejectedValue(new Error("Database error"));

      const req = createMockRequest({ method: "GET" });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe("HTTP method restrictions", () => {
    it("should return 405 for POST requests", async () => {
      const req = createMockRequest({ method: "POST", body: validAboutData });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toContain("Method Not Allowed");
    });

    it("should return 405 for PUT requests", async () => {
      const req = createMockRequest({ method: "PUT" });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toContain("Method Not Allowed");
    });

    it("should return 405 for DELETE requests", async () => {
      const req = createMockRequest({ method: "DELETE" });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });

    it("should return 405 for PATCH requests", async () => {
      const req = createMockRequest({ method: "PATCH" });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });
});
