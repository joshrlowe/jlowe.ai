/**
 * Tests for /api/comments/index.ts
 *
 * Covers GET (public moderation filter), POST happy path (approved /
 * held / rejected via mocked scoreComment), POST validation, and the
 * fail-open behavior when scoreComment throws.
 */
import commentsHandler from "../../../pages/api/comments/index";
import prisma from "../../../lib/prisma";
import { scoreComment } from "../../../lib/moderation/comment";
import { ModerationError } from "../../../lib/moderation/types";
import {
  createMockRequest,
  createMockResponse,
  getJsonResponse,
  getStatusCode,
} from "../../setup/api-test-utils.js";

jest.mock("../../../lib/prisma", () => ({
  __esModule: true,
  default: {
    comment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    commentVote: {
      findMany: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../../lib/moderation/comment", () => ({
  __esModule: true,
  scoreComment: jest.fn(),
}));

// Bypass Upstash rate limit in tests — env vars not set, so the helper
// returns true on its own, but stub explicitly for clarity.
jest.mock("../../../lib/utils/rateLimit", () => ({
  __esModule: true,
  checkRateLimit: jest.fn().mockResolvedValue(true),
}));

const cleanScores = {
  spam: 0.05,
  toxicity: 0.05,
  offTopic: 0.1,
  pii: 0.0,
  summary: "Friendly on-topic comment.",
};

const spammyScores = {
  spam: 0.55, // ≥ 0.4 hold band
  toxicity: 0.05,
  offTopic: 0.1,
  pii: 0.0,
  summary: "Promotional content with link.",
};

const toxicScores = {
  spam: 0.1,
  toxicity: 0.92, // ≥ 0.8 reject band
  offTopic: 0.0,
  pii: 0.0,
  summary: "Severe personal attack.",
};

describe("/api/comments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mimic Prisma's `select` projection so our response-shape assertion
    // reflects what the real client returns. The route uses
    // `select: { id: true, createdAt: true }` on create.
    prisma.comment.create.mockImplementation(async ({ data, select }) => {
      const full = {
        id: "c1",
        createdAt: new Date("2026-05-08T12:00:00Z"),
        ...data,
      };
      if (!select) return full;
      const projected = {};
      for (const key of Object.keys(select)) {
        if (select[key]) projected[key] = full[key];
      }
      return projected;
    });
  });

  describe("GET", () => {
    it("filters on moderationStatus=approved by default", async () => {
      prisma.comment.findMany.mockResolvedValue([]);
      prisma.commentVote.findMany.mockResolvedValue([]);

      const req = createMockRequest({
        method: "GET",
        query: { postId: "post1" },
      });
      const res = createMockResponse();
      await commentsHandler(req, res);

      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            postId: "post1",
            moderationStatus: "approved",
          }),
        })
      );
      expect(getStatusCode(res)).toBe(200);
    });

    it("ignores approved=false and still filters on moderationStatus=approved", async () => {
      prisma.comment.findMany.mockResolvedValue([]);
      prisma.commentVote.findMany.mockResolvedValue([]);

      const req = createMockRequest({
        method: "GET",
        query: { postId: "post1", approved: "false" },
      });
      const res = createMockResponse();
      await commentsHandler(req, res);

      const callArg = prisma.comment.findMany.mock.calls[0][0];
      expect(callArg.where.moderationStatus).toBe("approved");
    });

    it("uses explicit select that excludes PII and moderation metadata", async () => {
      prisma.comment.findMany.mockResolvedValue([]);
      prisma.commentVote.findMany.mockResolvedValue([]);

      const req = createMockRequest({ method: "GET", query: { postId: "post1" } });
      const res = createMockResponse();
      await commentsHandler(req, res);

      const callArg = prisma.comment.findMany.mock.calls[0][0];
      // The call must use `select`, not `include` — defense in depth so
      // any future schema field is opt-in for public exposure.
      expect(callArg.select).toBeDefined();
      expect(callArg.include).toBeUndefined();
      // None of these may be on the select.
      const forbiddenFields = [
        "authorEmail",
        "approved",
        "moderationStatus",
        "moderationScores",
        "moderationModel",
        "moderatedAt",
        "ipAddress",
        "updatedAt",
      ];
      for (const field of forbiddenFields) {
        expect(callArg.select[field]).toBeUndefined();
      }
    });

    it("never returns authorEmail or moderation metadata in the response", async () => {
      prisma.comment.findMany.mockResolvedValue([
        {
          id: "a",
          postId: "post1",
          authorName: "X",
          content: "y",
          likes: 0,
          dislikes: 0,
          parentId: null,
          createdAt: new Date("2026-05-08T12:00:00Z"),
          replies: [],
        },
      ]);
      prisma.commentVote.findMany.mockResolvedValue([]);

      const req = createMockRequest({ method: "GET", query: { postId: "post1" } });
      const res = createMockResponse();
      await commentsHandler(req, res);

      const body = getJsonResponse(res);
      expect(Array.isArray(body)).toBe(true); // bare array, not { comments: [] }
      for (const c of body) {
        expect(c).not.toHaveProperty("authorEmail");
        expect(c).not.toHaveProperty("approved");
        expect(c).not.toHaveProperty("moderationStatus");
        expect(c).not.toHaveProperty("moderationScores");
        expect(c).not.toHaveProperty("moderationModel");
        expect(c).not.toHaveProperty("moderatedAt");
      }
    });
  });

  describe("POST", () => {
    const baseBody = {
      postId: "post1",
      authorName: "John",
      authorEmail: "john@example.com",
      content: "Great post!",
    };

    beforeEach(() => {
      prisma.post.findUnique.mockResolvedValue({
        id: "post1",
        title: "AI From Scratch",
        topic: "ai",
      });
    });

    it("approves a clean comment and persists status='approved'", async () => {
      scoreComment.mockResolvedValue(cleanScores);

      const req = createMockRequest({ method: "POST", body: baseBody });
      const res = createMockResponse();
      await commentsHandler(req, res);

      expect(scoreComment).toHaveBeenCalledWith({
        content: baseBody.content,
        authorName: baseBody.authorName,
        postTitle: "AI From Scratch",
        postTopic: "ai",
      });
      expect(prisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            moderationStatus: "approved",
            approved: true,
            moderationModel: expect.stringContaining("claude-haiku"),
          }),
        })
      );
      expect(getStatusCode(res)).toBe(201);
      // Response shape: { id, createdAt } only — no leak of moderation state.
      const body = getJsonResponse(res);
      expect(body).toEqual(expect.objectContaining({ id: expect.any(String) }));
      expect(body.moderationStatus).toBeUndefined();
      expect(body.moderationScores).toBeUndefined();
    });

    it("holds a comment that crosses the spam hold threshold", async () => {
      scoreComment.mockResolvedValue(spammyScores);

      const req = createMockRequest({ method: "POST", body: baseBody });
      const res = createMockResponse();
      await commentsHandler(req, res);

      expect(prisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            moderationStatus: "held",
            approved: false,
          }),
        })
      );
      expect(getStatusCode(res)).toBe(201);
    });

    it("rejects a comment that crosses the toxicity reject threshold", async () => {
      scoreComment.mockResolvedValue(toxicScores);

      const req = createMockRequest({ method: "POST", body: baseBody });
      const res = createMockResponse();
      await commentsHandler(req, res);

      expect(prisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            moderationStatus: "rejected",
            approved: false,
          }),
        })
      );
      expect(getStatusCode(res)).toBe(201);
    });

    it("fails open to 'held' when scoreComment throws ModerationError", async () => {
      scoreComment.mockRejectedValue(new ModerationError("timeout", "exceeded 5000ms"));

      const req = createMockRequest({ method: "POST", body: baseBody });
      const res = createMockResponse();
      await commentsHandler(req, res);

      expect(prisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            moderationStatus: "held",
            approved: false,
            moderationModel: "error",
          }),
        })
      );
      expect(getStatusCode(res)).toBe(201);
    });

    it("returns 400 if required fields are missing", async () => {
      const req = createMockRequest({
        method: "POST",
        body: { postId: "post1" }, // missing authorName, content
      });
      const res = createMockResponse();
      await commentsHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(scoreComment).not.toHaveBeenCalled();
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it("returns 404 if the post does not exist", async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      const req = createMockRequest({ method: "POST", body: baseBody });
      const res = createMockResponse();
      await commentsHandler(req, res);

      expect(getStatusCode(res)).toBe(404);
      expect(scoreComment).not.toHaveBeenCalled();
    });
  });
});
