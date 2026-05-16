/**
 * Tests for /api/posts/index.js
 */
import postsHandler from "../../../pages/api/posts/index";
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
    post: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe("POST /api/posts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET requests", () => {
    it("should return all published posts by default", async () => {
      const mockPosts = [
        { id: "1", title: "Post 1", status: "Published" },
        { id: "2", title: "Post 2", status: "Published" },
      ];

      prisma.post.findMany.mockResolvedValue(mockPosts);
      prisma.post.count.mockResolvedValue(2);

      const req = createMockRequest({ method: "GET" });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith({
        where: { status: "Published" },
        orderBy: { datePublished: "desc" },
        include: {
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      });

      expect(getStatusCode(res)).toBe(200);
      const response = getJsonResponse(res);
      expect(response.posts).toEqual(mockPosts);
      expect(response.total).toBe(2);
    });

    it("should filter by topic", async () => {
      const mockPosts = [{ id: "1", title: "Post 1", topic: "react" }];
      prisma.post.findMany.mockResolvedValue(mockPosts);
      prisma.post.count.mockResolvedValue(1);

      const req = createMockRequest({
        method: "GET",
        query: { topic: "react" },
      });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            topic: "react",
          }),
        })
      );
    });

    it("should filter by search query", async () => {
      const mockPosts = [{ id: "1", title: "React Tutorial" }];
      prisma.post.findMany.mockResolvedValue(mockPosts);
      prisma.post.count.mockResolvedValue(1);

      const req = createMockRequest({
        method: "GET",
        query: { search: "react" },
      });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([{ title: { contains: "react", mode: "insensitive" } }]),
          }),
        })
      );
    });

    it("should paginate results", async () => {
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(0);

      const req = createMockRequest({
        method: "GET",
        query: { limit: "10", offset: "20" },
      });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });
  });

  describe("HTTP method restrictions", () => {
    it("returns 405 for unauthenticated POST (handler removed for security; use /api/admin/posts)", async () => {
      const req = createMockRequest({
        method: "POST",
        body: { title: "x", description: "y", postType: "Article", topic: "t", slug: "s", author: "a" },
      });
      const res = createMockResponse();
      await postsHandler(req, res);
      expect(getStatusCode(res)).toBe(405);
    });

    it("returns 405 for PUT", async () => {
      const req = createMockRequest({ method: "PUT" });
      const res = createMockResponse();
      await postsHandler(req, res);
      expect(getStatusCode(res)).toBe(405);
    });

    it("returns 405 for DELETE", async () => {
      const req = createMockRequest({ method: "DELETE" });
      const res = createMockResponse();
      await postsHandler(req, res);
      expect(getStatusCode(res)).toBe(405);
    });
  });
});
