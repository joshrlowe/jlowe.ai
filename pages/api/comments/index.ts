import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import prisma from "../../../lib/prisma";
import { createApiHandler } from "../../../lib/utils/apiRouteHandler";
import {
  combineValidations,
  validateEmail,
  validateMaxLength,
  validateRequiredFields,
} from "../../../lib/utils/validators";
import { checkRateLimit } from "../../../lib/utils/rateLimit";
import { scoreComment } from "@/lib/moderation/comment";
import { decide } from "@/lib/moderation/policy";
import { ModerationError } from "@/lib/moderation/types";
import { MODERATION_MODEL_ID } from "@/lib/bedrock/client";

const COMMENTS_PER_PAGE_LIMIT = 100;

interface CommentWithReplies {
  id: string;
  replies?: CommentWithReplies[];
  [key: string]: unknown;
}

const getUserIP = (req: NextApiRequest): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "0.0.0.0";
};

const handleGetRequest = async (req: NextApiRequest, res: NextApiResponse) => {
  const { postId, approved = "true" } = req.query;
  const userIP = getUserIP(req);

  // Public read: filter on the moderation pipeline column. The legacy
  // `approved` query param is preserved for backwards compat — when a
  // caller explicitly opts out of filtering by passing `approved=false`
  // we return everything (admin tooling does this).
  const publicOnly = approved === "true";
  const moderationFilter = publicOnly ? { moderationStatus: "approved" as const } : {};

  const where = {
    postId: postId as string,
    parentId: null as string | null,
    ...moderationFilter,
  };

  const comments = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: COMMENTS_PER_PAGE_LIMIT,
    include: {
      replies: {
        where: moderationFilter,
        orderBy: { createdAt: "asc" },
        include: {
          replies: {
            where: moderationFilter,
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  // Get user's votes for all comments
  const commentIds: string[] = [];
  const collectIds = (cmts: CommentWithReplies[]) => {
    cmts.forEach((c) => {
      commentIds.push(c.id);
      if (c.replies) collectIds(c.replies);
    });
  };
  collectIds(comments as unknown as CommentWithReplies[]);

  const userVotes = await prisma.commentVote.findMany({
    where: {
      commentId: { in: commentIds },
      userIP,
    },
  });

  const voteMap: Record<string, string> = {};
  userVotes.forEach((v) => {
    voteMap[v.commentId] = v.voteType;
  });

  // Add userVote to each comment
  const addUserVotes = (cmts: CommentWithReplies[]): CommentWithReplies[] => {
    return cmts.map((c) => ({
      ...c,
      userVote: voteMap[c.id] || null,
      replies: c.replies ? addUserVotes(c.replies) : [],
    }));
  };

  res.json(addUserVotes(comments as unknown as CommentWithReplies[]));
};

const handlePostRequest = async (req: NextApiRequest, res: NextApiResponse) => {
  const { postId, authorName, authorEmail, content, parentId } = req.body;

  const requiredValidation = validateRequiredFields(req.body, ["postId", "authorName", "content"]);

  if (!requiredValidation.isValid) {
    return res.status(400).json({ message: requiredValidation.message });
  }

  const validation = combineValidations(
    validateMaxLength(authorName, "authorName", 100),
    validateMaxLength(content, "content", 5000),
    authorEmail ? validateEmail(authorEmail) : { isValid: true }
  );

  if (!validation.isValid) {
    return res.status(400).json({ message: validation.message });
  }

  const allowed = await checkRateLimit(req, res, {
    maxRequests: 5,
    windowSeconds: 60,
    keyPrefix: "comments",
  });
  if (!allowed) return;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, title: true, topic: true },
  });

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true },
    });

    if (!parentComment) {
      return res.status(404).json({ message: "Parent comment not found" });
    }
  }

  // Moderate. On any failure (timeout, Bedrock outage, malformed model
  // output) we fail open to "held" so an admin can release the comment.
  // We never auto-reject due to infrastructure failure.
  let moderationStatus: "approved" | "held" | "rejected" = "held";
  let moderationScores: Prisma.InputJsonValue | null = null;
  let moderationModel: string = "error";
  const moderatedAt = new Date();

  try {
    const scores = await scoreComment({
      content,
      authorName,
      postTitle: post.title,
      postTopic: post.topic,
    });
    const decision = decide(scores);
    moderationStatus = decision.status;
    moderationScores = {
      ...scores,
      decisionReason: decision.status === "approved" ? null : decision.reason,
    };
    moderationModel = MODERATION_MODEL_ID;
  } catch (err) {
    // ModerationError is expected — anything else is unexpected and
    // also fails open, but we log it loud so ops can investigate.
    if (!(err instanceof ModerationError)) {
      console.error("[comments] unexpected moderation error:", err);
    } else {
      console.warn("[comments] moderation fail-open hold:", err.kind, err.message);
    }
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      authorName,
      authorEmail: authorEmail || null,
      content,
      approved: moderationStatus === "approved",
      moderationStatus,
      moderationScores: moderationScores === null ? Prisma.JsonNull : moderationScores,
      moderationModel,
      moderatedAt,
      parentId: parentId || null,
    },
    select: { id: true, createdAt: true },
  });

  // Don't leak moderation status to the client. Approved comments will
  // appear on the next GET; held / rejected ones won't. The caller's
  // UX shows "Comment posted successfully!" either way.
  res.status(201).json(comment);
};

export default createApiHandler({
  GET: handleGetRequest,
  POST: handlePostRequest,
});
