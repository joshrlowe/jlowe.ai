import prisma from "../../../lib/prisma.js";
import { createApiHandler } from "../../../lib/utils/apiRouteHandler.js";
import { validateRequiredFields } from "../../../lib/utils/validators.js";

const COMMENTS_PER_PAGE_LIMIT = 100;

const handleGetRequest = async (req, res) => {
  const { postId, approved = "true" } = req.query;

  const where = {
    postId,
    ...(approved === "true" && { approved: true }),
  };

  const comments = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: COMMENTS_PER_PAGE_LIMIT,
  });

  res.json(comments);
};

const handlePostRequest = async (req, res) => {
  const { postId, authorName, authorEmail, content } = req.body;

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

  const comment = await prisma.comment.create({
    data: {
      postId,
      authorName,
      authorEmail: authorEmail || null,
      content,
      approved: true,
    },
  });

  res.status(201).json(comment);
};

export default createApiHandler({
  GET: handleGetRequest,
  POST: handlePostRequest,
});
