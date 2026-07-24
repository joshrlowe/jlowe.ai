/**
 * Tests for /api/projects/index.js
 *
 * Tests projects CRUD API route
 */

import projectsHandler from "../../../pages/api/projects/index";
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
    project: {
      findMany: jest.fn(),
    },
  },
}));

describe("/api/projects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET requests", () => {
    it("should return all projects with 200", async () => {
      const mockProjects = [
        {
          id: "1",
          title: "Project 1",
          startDate: new Date("2023-01-01"),
          teamMembers: [],
        },
        {
          id: "2",
          title: "Project 2",
          startDate: new Date("2022-01-01"),
          teamMembers: [],
        },
      ];

      prisma.project.findMany.mockResolvedValue(mockProjects);

      const req = createMockRequest({ method: "GET" });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        take: 100,
        orderBy: { startDate: "desc" },
        include: { teamMembers: true },
      });
      expect(getStatusCode(res)).toBe(200);
      expect(Array.isArray(getJsonResponse(res))).toBe(true);
    });

    it("should return empty array when no projects exist", async () => {
      prisma.project.findMany.mockResolvedValue([]);

      const req = createMockRequest({ method: "GET" });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
      expect(getJsonResponse(res)).toEqual([]);
    });

    it("should limit to 100 projects", async () => {
      prisma.project.findMany.mockResolvedValue([]);

      const req = createMockRequest({ method: "GET" });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(prisma.project.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
    });

    it("should handle database errors with 500", async () => {
      prisma.project.findMany.mockRejectedValue(new Error("Database error"));

      const req = createMockRequest({ method: "GET" });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe("HTTP method restrictions", () => {
    it("returns 405 for unauthenticated POST (handler removed for security; use /api/admin/projects)", async () => {
      const req = createMockRequest({
        method: "POST",
        body: { title: "x", startDate: "2023-01-01", team: [] },
      });
      const res = createMockResponse();
      await projectsHandler(req, res);
      expect(getStatusCode(res)).toBe(405);
    });

    it("should return 405 for PUT requests", async () => {
      const req = createMockRequest({ method: "PUT" });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toContain("Method Not Allowed");
    });

    it("should return 405 for DELETE requests", async () => {
      const req = createMockRequest({ method: "DELETE" });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });

    it("should return 405 for PATCH requests", async () => {
      const req = createMockRequest({ method: "PATCH" });
      const res = createMockResponse();

      await projectsHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });
});
