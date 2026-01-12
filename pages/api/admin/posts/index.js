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
    const { status = "all", topic, search, limit, offset = 0 } = req.query;

    const where = {};
    if (status !== "all") {
      where.status = status;
    }
    if (topic) {
      where.topic = topic.toLowerCase();
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: limit ? parseInt(limit) : 100,
      skip: parseInt(offset),
      include: {
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    const total = await prisma.post.count({ where });

    res.json({
      posts,
      total,
      limit: limit ? parseInt(limit) : posts.length,
      offset: parseInt(offset),
    });
  } catch (error) {
    handleApiError(error, res);
  }
};

const handlePostRequest = async (req, res) => {
  try {
    const {
      title,
      description,
      postType,
      url,
      content,
      tags,
      topic,
      slug,
      author,
      status = "Draft",
      coverImage,
      metaTitle,
      metaDescription,
      ogImage,
      datePublished,
    } = req.body;

    if (!title || !description || !postType || !topic || !slug || !author) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Calculate reading time if content exists
    let readingTime = null;
    if (content) {
      const { calculateReadingTime } = await import(
        "../../../../lib/utils/readingTime.js"
      );
      readingTime = calculateReadingTime(content);
    }

    const post = await prisma.post.create({
      data: {
        title,
        description,
        postType,
        url: url || null,
        content: content || null,
        tags: tags || [],
        topic: topic.toLowerCase(),
        slug,
        author,
        status,
        coverImage: coverImage || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        ogImage: ogImage || null,
        readingTime,
        datePublished: datePublished
          ? new Date(datePublished)
          : status === "Published"
            ? new Date()
            : null,
      },
    });

    res.status(201).json(post);
  } catch (error) {
    handleApiError(error, res);
  }
};
