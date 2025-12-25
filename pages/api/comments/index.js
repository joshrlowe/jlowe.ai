import prisma from "../../../lib/prisma.js";
import { handleApiError } from "../../../lib/utils/apiErrorHandler.js";
import { validateRequiredFields } from "../../../lib/utils/apiHelpers.js";

export default async (req, res) => {
  switch (req.method) {
    case "GET":
      await handleGetRequest(req, res);
      break;
    case "POST":
      await handlePostRequest(req, res);
      break;
    default:
      res.status(405).json({ message: "Method Not Allowed" });
      break;
  }
};

const handleGetRequest = async (req, res) => {
  try {
    const { postId, approved = "true" } = req.query;

    const where = {
      postId,
      ...(approved === "true" && { approved: true }),
    };

    const comments = await prisma.comment.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(comments);
  } catch (error) {
    handleApiError(error, res);
  }
};

const handlePostRequest = async (req, res) => {
  try {
    const { postId, authorName, authorEmail, content } = req.body;

    const validation = validateRequiredFields(req.body, ["postId", "authorName", "content"]);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    // Verify post exists
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
        approved: false, // Require moderation by default
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    handleApiError(error, res);
  }
};

