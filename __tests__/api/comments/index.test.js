/**
 * Tests for /api/comments/index.js
 */
import commentsHandler from "../../../pages/api/comments/index.js";
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
    comment: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
    },
  },
}));

describe("POST /api/comments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET requests", () => {
    it("should return approved comments for a post", async () => {
      const mockComments = [
        {
          id: "1",
          postId: "post1",
          authorName: "John",
          content: "Great post!",
          approved: true,
        },
      ];

      prisma.comment.findMany.mockResolvedValue(mockComments);

      const req = createMockRequest({
        method: "GET",
        query: { postId: "post1", approved: "true" },
      });
      const res = createMockResponse();

      await commentsHandler(req, res);

      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: {
          postId: "post1",
          approved: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      });

      expect(getStatusCode(res)).toBe(200);
      const response = getJsonResponse(res);
      expect(response).toEqual(mockComments);
    });

    it("should return all comments when approved is not specified", async () => {
      const mockComments = [
        {
          id: "1",
          postId: "post1",
          approved: false,
        },
        {
          id: "2",
          postId: "post1",
          approved: true,
        },
      ];

      prisma.comment.findMany.mockResolvedValue(mockComments);

      const req = createMockRequest({
        method: "GET",
        query: { postId: "post1", approved: "false" },
      });
      const res = createMockResponse();

      await commentsHandler(req, res);

      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: {
          postId: "post1",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      });
    });
  });

  describe("POST requests", () => {
    it("should create a new comment", async () => {
      const mockPost = { id: "post1", title: "Test Post" };
      const mockComment = {
        id: "1",
        postId: "post1",
        authorName: "John",
        authorEmail: "john@example.com",
        content: "Great post!",
        approved: false,
      };

      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.comment.create.mockResolvedValue(mockComment);

      const req = createMockRequest({
        method: "POST",
        body: {
          postId: "post1",
          authorName: "John",
          authorEmail: "john@example.com",
          content: "Great post!",
        },
      });
      const res = createMockResponse();

      await commentsHandler(req, res);

      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: "post1" },
      });

      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          postId: "post1",
          authorName: "John",
          authorEmail: "john@example.com",
          content: "Great post!",
          approved: false,
        },
      });

      expect(getStatusCode(res)).toBe(201);
      const response = getJsonResponse(res);
      expect(response).toEqual(mockComment);
    });

    it("should return 400 if required fields are missing", async () => {
      const req = createMockRequest({
        method: "POST",
        body: {
          postId: "post1",
          // Missing authorName and content
        },
      });
      const res = createMockResponse();

      await commentsHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      const response = getJsonResponse(res);
      expect(response.message).toContain("Missing required fields");
    });

    it("should return 404 if post does not exist", async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      const req = createMockRequest({
        method: "POST",
        body: {
          postId: "nonexistent",
          authorName: "John",
          content: "Comment",
        },
      });
      const res = createMockResponse();

      await commentsHandler(req, res);

      expect(getStatusCode(res)).toBe(404);
      const response = getJsonResponse(res);
      expect(response.message).toContain("Post not found");
    });

    it("should allow optional email field", async () => {
      const mockPost = { id: "post1" };
      const mockComment = {
        id: "1",
        postId: "post1",
        authorName: "John",
        authorEmail: null,
        content: "Comment",
        approved: false,
      };

      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.comment.create.mockResolvedValue(mockComment);

      const req = createMockRequest({
        method: "POST",
        body: {
          postId: "post1",
          authorName: "John",
          content: "Comment",
        },
      });
      const res = createMockResponse();

      await commentsHandler(req, res);

      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          authorEmail: null,
        }),
      });
    });
  });
});
