import prisma from "../../../../../lib/prisma.js";
import { handleApiError } from "../../../../../lib/utils/apiErrorHandler.js";

export default async (req, res) => {
  switch (req.method) {
    case "POST":
      await handlePostRequest(req, res);
      break;
    case "GET":
      await handleGetRequest(req, res);
      break;
    default:
      res.status(405).json({ message: "Method Not Allowed" });
      break;
  }
};

const handlePostRequest = async (req, res) => {
  try {
    const { topic, slug } = req.query;
    const userIP =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Find post
    const post = await prisma.post.findUnique({
      where: {
        slug,
        topic: topic.toLowerCase(),
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if like already exists
    const existingLike = await prisma.like.findFirst({
      where: {
        postId: post.id,
        userIP,
      },
    });

    if (existingLike) {
      return res.status(400).json({ message: "Already liked" });
    }

    // Create like
    const _like = await prisma.like.create({
      data: {
        postId: post.id,
        userIP,
        userAgent,
      },
    });

    // Get updated like count
    const likeCount = await prisma.like.count({
      where: { postId: post.id },
    });

    res.json({ liked: true, likeCount });
  } catch (error) {
    // Handle unique constraint violation (already liked) or any other error
    if (error.code === "P2002" || error.message?.includes("unique")) {
      return res.status(400).json({ message: "Already liked" });
    }
    handleApiError(error, res);
  }
};

const handleGetRequest = async (req, res) => {
  try {
    const { topic, slug } = req.query;
    // Get IP from various headers (respecting proxies)
    const forwarded = req.headers["x-forwarded-for"];
    const userIP = forwarded
      ? forwarded.split(",")[0].trim()
      : req.connection?.remoteAddress || req.socket?.remoteAddress || "0.0.0.0";

    // Find post
    const post = await prisma.post.findUnique({
      where: {
        slug,
        topic: topic.toLowerCase(),
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user has liked
    const existingLike = await prisma.like.findFirst({
      where: {
        postId: post.id,
        userIP,
      },
    });

    // Get total like count
    const likeCount = await prisma.like.count({
      where: { postId: post.id },
    });

    res.json({
      liked: !!existingLike,
      likeCount,
    });
  } catch (error) {
    handleApiError(error, res);
  }
};
