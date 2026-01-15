import prisma from "../../../lib/prisma.js";
import { createApiHandler } from "../../../lib/utils/apiRouteHandler.js";
import { validateRequiredFields } from "../../../lib/utils/validators.js";

const COMMENTS_PER_PAGE_LIMIT = 100;

// Get user IP helper
const getUserIP = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  return forwarded
    ? forwarded.split(",")[0].trim()
    : req.connection?.remoteAddress || req.socket?.remoteAddress || "0.0.0.0";
};

const handleGetRequest = async (req, res) => {
  const { postId, approved = "true" } = req.query;
  const userIP = getUserIP(req);

  // Only get top-level comments (parentId is null)
  const where = {
    postId,
    parentId: null, // Only top-level comments
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
  const commentIds = [];
  const collectIds = (cmts) => {
    cmts.forEach((c) => {
      commentIds.push(c.id);
      if (c.replies) collectIds(c.replies);
    });
  };
  collectIds(comments);

  const userVotes = await prisma.commentVote.findMany({
    where: {
      commentId: { in: commentIds },
      userIP,
    },
  });

  const voteMap = {};
  userVotes.forEach((v) => {
    voteMap[v.commentId] = v.voteType;
  });

  // Add userVote to each comment
  const addUserVotes = (cmts) => {
    return cmts.map((c) => ({
      ...c,
      userVote: voteMap[c.id] || null,
      replies: c.replies ? addUserVotes(c.replies) : [],
    }));
  };

  res.json(addUserVotes(comments));
};

const handlePostRequest = async (req, res) => {
  const { postId, authorName, authorEmail, content, parentId } = req.body;

  const validation = validateRequiredFields(req.body, [
    "postId",
    "authorName",
    "content",
  ]);

  if (!validation.isValid) {
    return res.status(400).json({ message: validation.message });
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  // If replying, verify parent comment exists
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
