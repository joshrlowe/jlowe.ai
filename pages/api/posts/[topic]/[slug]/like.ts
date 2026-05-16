import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../../lib/prisma";
import { handleApiError } from "../../../../../lib/utils/apiErrorHandler";
import { checkRateLimit } from "../../../../../lib/utils/rateLimit";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
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

export default handler;

const handlePostRequest = async (req: NextApiRequest, res: NextApiResponse) => {
  const allowed = await checkRateLimit(req, res, {
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: "post-like",
  });
  if (!allowed) return;

  try {
    const { topic, slug } = req.query;
    const userIP =
      (req.headers["x-forwarded-for"] as string) || req.connection.remoteAddress || "unknown";
    const userAgent = (req.headers["user-agent"] as string) || "unknown";

    // Find post
    const post = await prisma.post.findUnique({
      where: {
        slug: slug as string,
        topic: (topic as string).toLowerCase(),
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
    const err = error as Error & { code?: string };
    if (err.code === "P2002" || err.message?.includes("unique")) {
      return res.status(400).json({ message: "Already liked" });
    }
    handleApiError(error as Error, res);
  }
};

const handleGetRequest = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { topic, slug } = req.query;
    // Get IP from various headers (respecting proxies)
    const forwarded = req.headers["x-forwarded-for"] as string | undefined;
    const userIP = forwarded
      ? forwarded.split(",")[0].trim()
      : req.connection?.remoteAddress || req.socket?.remoteAddress || "0.0.0.0";

    // Find post
    const post = await prisma.post.findUnique({
      where: {
        slug: slug as string,
        topic: (topic as string).toLowerCase(),
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
    handleApiError(error as Error, res);
  }
};
