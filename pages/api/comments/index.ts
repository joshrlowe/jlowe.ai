import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { createApiHandler } from "../../../lib/utils/apiRouteHandler";
import {
  combineValidations,
  validateEmail,
  validateMaxLength,
  validateRequiredFields,
} from "../../../lib/utils/validators";
import { checkRateLimit } from "../../../lib/utils/rateLimit";

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

  const where = {
    postId: postId as string,
    parentId: null as string | null,
    ...(approved === "true" && { approved: true }),
  };

  const comments = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: COMMENTS_PER_PAGE_LIMIT,
    include: {
      replies: {
        where: approved === "true" ? { approved: true } : {},
        orderBy: { createdAt: "asc" },
        include: {
          replies: {
            where: approved === "true" ? { approved: true } : {},
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

  const requiredValidation = validateRequiredFields(req.body, [
    "postId",
    "authorName",
    "content",
  ]);

  if (!requiredValidation.isValid) {
    return res.status(400).json({ message: requiredValidation.message });
  }

  const validation = combineValidations(
    validateMaxLength(authorName, "authorName", 100),
    validateMaxLength(content, "content", 5000),
    authorEmail ? validateEmail(authorEmail) : { isValid: true },
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
  });

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
    });

    if (!parentComment) {
      return res.status(404).json({ message: "Parent comment not found" });
    }
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      authorName,
      authorEmail: authorEmail || null,
      content,
      approved: true,
      parentId: parentId || null,
    },
  });

  res.status(201).json(comment);
};

export default createApiHandler({
  GET: handleGetRequest,
  POST: handlePostRequest,
});
