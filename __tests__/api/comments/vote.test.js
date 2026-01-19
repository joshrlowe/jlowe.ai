/**
 * Tests for /api/comments/[id]/vote.js
 */

import voteHandler from "../../../pages/api/comments/[id]/vote.js";
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
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    commentVote: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe("POST /api/comments/[id]/vote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Method validation", () => {
    it("should return 405 for GET requests", async () => {
      const req = createMockRequest({
        method: "GET",
        query: { id: "comment1" },
      });
      const res = createMockResponse();

      await voteHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res)).toEqual({ message: "Method Not Allowed" });
    });

    it("should return 405 for PUT requests", async () => {
      const req = createMockRequest({
        method: "PUT",
        query: { id: "comment1" },
      });
      const res = createMockResponse();

      await voteHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });

    it("should return 405 for DELETE requests", async () => {
      const req = createMockRequest({
        method: "DELETE",
        query: { id: "comment1" },
      });
      const res = createMockResponse();

      await voteHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });

  describe("Vote type validation", () => {
    it("should return 400 for invalid vote type", async () => {
      const req = createMockRequest({
        method: "POST",
        query: { id: "comment1" },
        body: { voteType: "invalid" },
      });
      const res = createMockResponse();

      await voteHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res)).toEqual({ message: "Invalid vote type" });
    });

    it("should accept 'like' vote type", async () => {
      prisma.comment.findUnique
        .mockResolvedValueOnce({ id: "comment1", likes: 0, dislikes: 0 })
        .mockResolvedValueOnce({ likes: 1, dislikes: 0 });
      prisma.commentVote.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockResolvedValue([]);

      const req = createMockRequest({
        method: "POST",
        query: { id: "comment1" },
        body: { voteType: "like" },
      });
      const res = createMockResponse();

      await voteHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
    });

    it("should accept 'dislike' vote type", async () => {
      prisma.comment.findUnique
        .mockResolvedValueOnce({ id: "comment1", likes: 0, dislikes: 0 })
        .mockResolvedValueOnce({ likes: 0, dislikes: 1 });
      prisma.commentVote.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockResolvedValue([]);

      const req = createMockRequest({
        method: "POST",
        query: { id: "comment1" },
        body: { voteType: "dislike" },
      });
      const res = createMockResponse();

      await voteHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
    });
  });

  describe("Comment not found", () => {
    it("should return 404 if comment does not exist", async () => {
      prisma.comment.findUnique.mockResolvedValue(null);

      const req = createMockRequest({
        method: "POST",
        query: { id: "nonexistent" },
        body: { voteType: "like" },
      });
      const res = createMockResponse();

      await voteHandler(req, res);

      expect(getStatusCode(res)).toBe(404);
      expect(getJsonResponse(res)).toEqual({ message: "Comment not found" });
    });
  });

  describe("New vote", () => {
    it("should create a new like vote", async () => {
      prisma.comment.findUnique
        .mockResolvedValueOnce({ id: "comment1", likes: 0, dislikes: 0 })
        .mockResolvedValueOnce({ likes: 1, dislikes: 0 });
      prisma.commentVote.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ voteType: "like" });
      prisma.$transaction.mockResolvedValue([]);

      const req = createMockRequest({
        method: "POST",
        query: { id: "comment1" },
        body: { voteType: "like" },
        headers: { "x-forwarded-for": "192.168.1.1" },
      });
      const res = createMockResponse();

      await voteHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
      expect(prisma.$transaction).toHaveBeenCalled();
      
      const response = getJsonResponse(res);
      expect(response.likes).toBe(1);
      expect(response.dislikes).toBe(0);
      expect(response.userVote).toBe("like");
    });

    it("should create a new dislike vote", async () => {
      prisma.comment.findUnique
        .mockResolvedValueOnce({ id: "comment1", likes: 0, dislikes: 0 })
        .mockResolvedValueOnce({ likes: 0, dislikes: 1 });
      prisma.commentVote.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ voteType: "dislike" });
      prisma.$transaction.mockResolvedValue([]);

      const req = createMockRequest({
        method: "POST",
        query: { id: "comment1" },
        body: { voteType: "dislike" },
      });
      const res = createMockResponse();

      await voteHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
      
      const response = getJsonResponse(res);
      expect(response.dislikes).toBe(1);
      expect(response.userVote).toBe("dislike");
    });
  });

  describe("Toggle vote (same vote type)", () => {
    it("should remove like when clicking like again", async () => {
      prisma.comment.findUnique
        .mockResolvedValueOnce({ id: "comment1", likes: 1, dislikes: 0 })
        .mockResolvedValueOnce({ likes: 0, dislikes: 0 });
      prisma.commentVote.findUnique
        .mockResolvedValueOnce({ id: "vote1", voteType: "like" })
        .mockResolvedValueOnce(null);
      prisma.$transaction.mockResolvedValue([]);

      const req = createMockRequest({
        method: "POST",
        query: { id: "comment1" },
        body: { voteType: "like" },
      });
      const res = createMockResponse();

      await voteHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
      expect(prisma.$transaction).toHaveBeenCalled();
      
      const response = getJsonResponse(res);
      expect(response.likes).toBe(0);
      expect(response.userVote).toBeNull();
    });
  });

  describe("Switch vote", () => {
    it("should switch from like to dislike", async () => {
      prisma.comment.findUnique
        .mockResolvedValueOnce({ id: "comment1", likes: 1, dislikes: 0 })
        .mockResolvedValueOnce({ likes: 0, dislikes: 1 });
      prisma.commentVote.findUnique
        .mockResolvedValueOnce({ id: "vote1", voteType: "like" })
        .mockResolvedValueOnce({ voteType: "dislike" });
      prisma.$transaction.mockResolvedValue([]);

      const req = createMockRequest({
        method: "POST",
        query: { id: "comment1" },
        body: { voteType: "dislike" },
      });
      const res = createMockResponse();

      await voteHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
      
      const response = getJsonResponse(res);
      expect(response.likes).toBe(0);
      expect(response.dislikes).toBe(1);
      expect(response.userVote).toBe("dislike");
    });

    it("should switch from dislike to like", async () => {
      prisma.comment.findUnique
        .mockResolvedValueOnce({ id: "comment1", likes: 0, dislikes: 1 })
        .mockResolvedValueOnce({ likes: 1, dislikes: 0 });
      prisma.commentVote.findUnique
        .mockResolvedValueOnce({ id: "vote1", voteType: "dislike" })
        .mockResolvedValueOnce({ voteType: "like" });
      prisma.$transaction.mockResolvedValue([]);

      const req = createMockRequest({
        method: "POST",
        query: { id: "comment1" },
        body: { voteType: "like" },
      });
      const res = createMockResponse();

      await voteHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
      
      const response = getJsonResponse(res);
      expect(response.likes).toBe(1);
      expect(response.dislikes).toBe(0);
      expect(response.userVote).toBe("like");
    });
  });

  describe("IP address handling", () => {
    it("should use x-forwarded-for header", async () => {
      prisma.comment.findUnique
        .mockResolvedValueOnce({ id: "comment1" })
        .mockResolvedValueOnce({ likes: 1, dislikes: 0 });
      prisma.commentVote.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockResolvedValue([]);

      const req = createMockRequest({
        method: "POST",
        query: { id: "comment1" },
        body: { voteType: "like" },
        headers: { "x-forwarded-for": "10.0.0.1, 192.168.1.1" },
      });
      const res = createMockResponse();

      await voteHandler(req, res);

      expect(prisma.commentVote.findUnique).toHaveBeenCalledWith({
        where: {
          commentId_userIP: {
            commentId: "comment1",
            userIP: "10.0.0.1",
          },
        },
      });
    });
  });

  describe("Error handling", () => {
    it("should handle database errors", async () => {
      prisma.comment.findUnique.mockRejectedValue(new Error("Database error"));

      const req = createMockRequest({
        method: "POST",
        query: { id: "comment1" },
        body: { voteType: "like" },
      });
      const res = createMockResponse();

      await voteHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });

    it("should handle transaction errors", async () => {
      prisma.comment.findUnique.mockResolvedValue({ id: "comment1" });
      prisma.commentVote.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockRejectedValue(new Error("Transaction failed"));

      const req = createMockRequest({
        method: "POST",
        query: { id: "comment1" },
        body: { voteType: "like" },
      });
      const res = createMockResponse();

      await voteHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });
});

