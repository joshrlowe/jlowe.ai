import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { handleApiError } from "../../../../lib/utils/apiErrorHandler";
import { checkRateLimit } from "../../../../lib/utils/rateLimit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const id = req.query.id as string;
    const { voteType } = req.body as { voteType: string }; // "like" or "dislike"

    if (!["like", "dislike"].includes(voteType)) {
      return res.status(400).json({ message: "Invalid vote type" });
    }

    const allowed = await checkRateLimit(req, res, {
      maxRequests: 10,
      windowSeconds: 60,
      keyPrefix: "comment-vote",
    });
    if (!allowed) return;

    // Get user IP
    const forwarded = req.headers["x-forwarded-for"];
    const userIP =
      typeof forwarded === "string"
        ? forwarded.split(",")[0].trim()
        : req.socket?.remoteAddress || "0.0.0.0";

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user already voted
    const existingVote = await prisma.commentVote.findUnique({
      where: {
        commentId_userIP: {
          commentId: id,
          userIP,
        },
      },
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Same vote - remove it (toggle off)
        await prisma.$transaction([
          prisma.commentVote.delete({
            where: { id: existingVote.id },
          }),
          prisma.comment.update({
            where: { id },
            data: {
              [voteType === "like" ? "likes" : "dislikes"]: {
                decrement: 1,
              },
            },
          }),
        ]);
      } else {
        // Different vote - switch it
        await prisma.$transaction([
          prisma.commentVote.update({
            where: { id: existingVote.id },
            data: { voteType },
          }),
          prisma.comment.update({
            where: { id },
            data: {
              likes: voteType === "like" ? { increment: 1 } : { decrement: 1 },
              dislikes: voteType === "dislike" ? { increment: 1 } : { decrement: 1 },
            },
          }),
        ]);
      }
    } else {
      // New vote
      await prisma.$transaction([
        prisma.commentVote.create({
          data: {
            commentId: id,
            userIP,
            voteType,
          },
        }),
        prisma.comment.update({
          where: { id },
          data: {
            [voteType === "like" ? "likes" : "dislikes"]: {
              increment: 1,
            },
          },
        }),
      ]);
    }

    // Get updated comment
    const updatedComment = await prisma.comment.findUnique({
      where: { id },
      select: { likes: true, dislikes: true },
    });

    // Get user's current vote
    const userVote = await prisma.commentVote.findUnique({
      where: {
        commentId_userIP: {
          commentId: id,
          userIP,
        },
      },
    });

    res.json({
      likes: updatedComment?.likes,
      dislikes: updatedComment?.dislikes,
      userVote: userVote?.voteType || null,
    });
  } catch (error) {
    handleApiError(error as Error, res);
  }
}
