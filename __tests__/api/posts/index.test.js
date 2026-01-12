/**
 * Tests for /api/posts/index.js
 */
import postsHandler from "../../../pages/api/posts/index.js";
import prisma from "../../../lib/prisma.js";
import {
  createMockRequest,
  createMockResponse,
  getJsonResponse,
  getStatusCode,
} from "../../setup/api-test-utils.js";

jest.mock("../../../lib/prisma.js", () => ({
  __esModule: true,
  default: {
    post: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
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
        }),
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
            OR: expect.arrayContaining([
              { title: { contains: "react", mode: "insensitive" } },
            ]),
          }),
        }),
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
        }),
      );
    });
  });

  describe("POST requests", () => {
    it("should create a new post", async () => {
      const mockPost = {
        id: "1",
        title: "New Post",
        description: "Description",
        postType: "Article",
        topic: "react",
        slug: "new-post",
        author: "John Doe",
        status: "Draft",
      };

      prisma.post.create.mockResolvedValue(mockPost);

      const req = createMockRequest({
        method: "POST",
        body: {
          title: "New Post",
          description: "Description",
          postType: "Article",
          topic: "react",
          slug: "new-post",
          author: "John Doe",
          content: "Post content",
        },
      });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
      const response = getJsonResponse(res);
      expect(response).toEqual(mockPost);
    });

    it("should return 400 if required fields are missing", async () => {
      const req = createMockRequest({
        method: "POST",
        body: {
          title: "New Post",
          // Missing required fields
        },
      });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      const response = getJsonResponse(res);
      expect(response.message).toContain("Missing required fields");
    });

    it("should calculate reading time for content", async () => {
      const mockPost = {
        id: "1",
        title: "New Post",
        readingTime: 5,
      };

      prisma.post.create.mockResolvedValue(mockPost);

      const req = createMockRequest({
        method: "POST",
        body: {
          title: "New Post",
          description: "Description",
          postType: "Article",
          topic: "react",
          slug: "new-post",
          author: "John Doe",
          content:
            "This is a test content with many words to calculate reading time properly.",
        },
      });
      const res = createMockResponse();

      await postsHandler(req, res);

      expect(prisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            readingTime: expect.any(Number),
          }),
        }),
      );
    });
  });
});
