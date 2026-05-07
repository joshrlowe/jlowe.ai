import type { NextApiRequest, NextApiResponse } from "next";
import type { JWT } from "next-auth/jwt";
import prisma from "../../../../lib/prisma";
import { handleApiError } from "../../../../lib/utils/apiErrorHandler";
import { withAuth } from "../../../../lib/utils/authMiddleware";

async function handler(req: NextApiRequest, res: NextApiResponse, _token: JWT) {
  switch (req.method) {
    case "GET":
      await handleGetRequest(req, res);
      break;
    case "PUT":
      await handlePutRequest(req, res);
      break;
    case "DELETE":
      await handleDeleteRequest(req, res);
      break;
    default:
      res.status(405).json({ message: "Method Not Allowed" });
      break;
  }
}

export default withAuth(handler);

const handleGetRequest = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const id = req.query.id as string;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    handleApiError(error as Error, res);
  }
};

const handlePutRequest = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const id = req.query.id as string;
    const updateData = req.body;

    // Calculate reading time if content is being updated
    if (updateData.content !== undefined) {
      const { calculateReadingTime } = await import(
        "../../../../lib/utils/readingTime"
      );
      updateData.readingTime = calculateReadingTime(updateData.content);
    }

    // Convert datePublished if provided
    if (updateData.datePublished) {
      updateData.datePublished = new Date(updateData.datePublished);
    }

    // Ensure topic is lowercase
    if (updateData.topic) {
      updateData.topic = updateData.topic.toLowerCase();
    }

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
    });

    res.json(post);
  } catch (error) {
    handleApiError(error as Error, res);
  }
};

const handleDeleteRequest = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const id = req.query.id as string;

    await prisma.post.delete({
      where: { id },
    });

    res.status(204).end();
  } catch (error) {
    handleApiError(error as Error, res);
  }
};
