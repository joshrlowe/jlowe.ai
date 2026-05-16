import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { createApiHandler } from "../../../lib/utils/apiRouteHandler";
import { handleApiError } from "../../../lib/utils/apiErrorHandler";
import {
  parsePagination,
  parseSort,
  buildOrderBy,
  formatPaginatedResponse,
} from "../../../lib/utils/apiHelpers";
import { buildPostWhereClause, buildPostQuery } from "../../../lib/utils/queryBuilders";
import { validateRequiredFields } from "../../../lib/utils/validators";

const handleGetRequest = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { topic, status = "Published", search, tags } = req.query;

    const { limit, offset } = parsePagination(req.query);
    const { sortBy, sortOrder } = parseSort(req.query, "datePublished", "desc");

    const where = buildPostWhereClause({
      status: status as string,
      topic: topic as string,
      search: search as string,
      tags: tags as string,
    });
    const orderBy = buildOrderBy(sortBy, sortOrder, {
      datePublished: "datePublished",
      createdAt: "createdAt",
      title: "title",
      viewCount: "viewCount",
    });

    const query = buildPostQuery({
      where,
      orderBy,
      limit,
      offset,
      includeCounts: true,
    });
    const posts = await prisma.post.findMany(query as Parameters<typeof prisma.post.findMany>[0]);
    const total = await prisma.post.count({ where } as Parameters<typeof prisma.post.count>[0]);

    res.json(formatPaginatedResponse(posts, total, limit, offset));
  } catch (error) {
    handleApiError(error as Error, res);
  }
};

const handlePostRequest = async (req: NextApiRequest, res: NextApiResponse) => {
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

    const validation = validateRequiredFields(req.body, [
      "title",
      "description",
      "postType",
      "topic",
      "slug",
      "author",
    ]);

    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    let readingTime = null;
    if (content) {
      const { calculateReadingTime } = await import("../../../lib/utils/readingTime");
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
    handleApiError(error as Error, res);
  }
};

export default createApiHandler({
  GET: handleGetRequest,
  POST: handlePostRequest,
});
