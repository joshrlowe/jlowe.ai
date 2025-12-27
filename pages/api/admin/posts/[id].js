import prisma from "../../../../lib/prisma.js";
import { handleApiError } from "../../../../lib/utils/apiErrorHandler.js";
import { getToken } from "next-auth/jwt";

export default async (req, res) => {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

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
};

const handleGetRequest = async (req, res) => {
  try {
    const { id } = req.query;

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
    handleApiError(error, res);
  }
};

const handlePutRequest = async (req, res) => {
  try {
    const { id } = req.query;
    const updateData = req.body;

    // Calculate reading time if content is being updated
    if (updateData.content !== undefined) {
      const { calculateReadingTime } = await import(
        "../../../../lib/utils/readingTime.js"
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
    handleApiError(error, res);
  }
};

const handleDeleteRequest = async (req, res) => {
  try {
    const { id } = req.query;

    await prisma.post.delete({
      where: { id },
    });

    res.status(204).end();
  } catch (error) {
    handleApiError(error, res);
  }
};
