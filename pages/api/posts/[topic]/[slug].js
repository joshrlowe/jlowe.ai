import prisma from "../../../../lib/prisma.js";
import { handleApiError } from "../../../../lib/utils/apiErrorHandler.js";

export default async (req, res) => {
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
    const { topic, slug } = req.query;

    const post = await prisma.post.findUnique({
      where: {
        slug,
        topic: topic.toLowerCase(),
      },
      include: {
        _count: {
          select: {
            comments: {
              where: {
                approved: true,
              },
            },
            likes: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Increment view count
    await prisma.post.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });

    res.json({
      ...post,
      viewCount: post.viewCount + 1, // Return updated count
    });
  } catch (error) {
    handleApiError(error, res);
  }
};

const handlePutRequest = async (req, res) => {
  try {
    const { topic, slug } = req.query;
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

    const post = await prisma.post.update({
      where: {
        slug,
        topic: topic.toLowerCase(),
      },
      data: updateData,
    });

    res.json(post);
  } catch (error) {
    handleApiError(error, res);
  }
};

const handleDeleteRequest = async (req, res) => {
  try {
    const { topic, slug } = req.query;

    await prisma.post.delete({
      where: {
        slug,
        topic: topic.toLowerCase(),
      },
    });

    res.status(204).end();
  } catch (error) {
    handleApiError(error, res);
  }
};
