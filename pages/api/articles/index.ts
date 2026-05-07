/**
 * Public Articles API
 *
 * GET: Fetch published articles with filtering and pagination
 * POST: Create new article (requires authentication)
 */

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { getToken } from "next-auth/jwt";
import { handleApiError } from "../../../lib/utils/apiErrorHandler";
import {
  parsePagination,
  parseSort,
  buildOrderBy,
  formatPaginatedResponse,
} from "../../../lib/utils/apiHelpers";
import {
  buildPostWhereClause,
  buildPostQuery,
} from "../../../lib/utils/queryBuilders";
import { validateRequiredFields } from "../../../lib/utils/validators";
import slugify from "slugify";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      return handleGetRequest(req, res);
    case "POST":
      return handlePostRequest(req, res);
    default:
      return res.status(405).json({ message: "Method Not Allowed" });
  }
}

/**
 * GET /api/articles
 * Fetch published articles with optional filters
 */
async function handleGetRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { topic, search, tags } = req.query;

    const { limit, offset } = parsePagination(req.query);
    const { sortBy, sortOrder } = parseSort(req.query, "datePublished", "desc");

    // Only show published articles for public API
    const where = buildPostWhereClause({
      status: "Published",
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
}

/**
 * POST /api/articles
 * Create a new article (requires authentication)
 */
async function handlePostRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check authentication
    const token = await getToken({ req });
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const {
      title,
      description,
      postType = "Article",
      url,
      content,
      tags,
      topic,
      slug: providedSlug,
      author,
      status = "Draft",
      coverImage,
      metaTitle,
      metaDescription,
      ogImage,
      datePublished,
    } = req.body;

    // Validate required fields
    const validation = validateRequiredFields(req.body, [
      "title",
      "description",
      "topic",
    ]);

    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    // Generate slug from title if not provided
    let slug = providedSlug as string;
    if (!slug) {
      slug = slugify(title, {
        lower: true,
        strict: true,
        trim: true,
      });
    }

    // Ensure slug is unique
    const existingPost = await prisma.post.findUnique({
      where: { slug },
    });

    if (existingPost) {
      // Append timestamp to make unique
      slug = `${slug}-${Date.now()}`;
    }

    // Calculate reading time if content exists
    let readingTime = null;
    if (content) {
      const { calculateReadingTime } = await import(
        "../../../lib/utils/readingTime"
      );
      readingTime = calculateReadingTime(content);
    }

    // Determine author from session or request
    const postAuthor = author || token.email || "Anonymous";

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
        author: postAuthor,
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
    // Handle unique constraint violations
    const err = error as Error & { code?: string };
    if (err.code === "P2002") {
      return res.status(400).json({
        message: "An article with this slug already exists",
      });
    }
    handleApiError(error as Error, res);
  }
}
