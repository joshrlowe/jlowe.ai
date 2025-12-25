import prisma from "../../../lib/prisma.js";
import { createApiHandler } from "../../../lib/utils/apiRouteHandler.js";
import { handleApiError } from "../../../lib/utils/apiErrorHandler.js";
import {
  parsePagination,
  parseSort,
  buildOrderBy,
  formatPaginatedResponse,
} from "../../../lib/utils/apiHelpers.js";
import { buildPostWhereClause, buildPostQuery } from "../../../lib/utils/queryBuilders.js";
import { validateRequiredFields } from "../../../lib/utils/validators.js";

// Refactored: Extract Method - GET handler with query builder
const handleGetRequest = async (req, res) => {
  try {
    const {
      topic,
      status = "Published", // Default to published only for public API
      search,
      tags,
    } = req.query;

    const { limit, offset } = parsePagination(req.query);
    const { sortBy, sortOrder } = parseSort(req.query, "datePublished", "desc");

    // Refactored: Extract Method - Where clause building extracted to query builder
    const where = buildPostWhereClause({ status, topic, search, tags });

    const orderBy = buildOrderBy(sortBy, sortOrder, {
      datePublished: "datePublished",
      createdAt: "createdAt",
      title: "title",
      viewCount: "viewCount",
    });

    // Refactored: Extract Method - Query building extracted to query builder
    const query = buildPostQuery({ where, orderBy, limit, offset, includeCounts: true });
    const posts = await prisma.post.findMany(query);
    const total = await prisma.post.count({ where });

    res.json(formatPaginatedResponse(posts, total, limit, offset));
  } catch (error) {
    handleApiError(error, res);
  }
};

// Refactored: Extract Method - POST handler extracted
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

    // Refactored: Extract Method - Validation extracted
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

    // Refactored: Extract Method - Reading time calculation extracted
    let readingTime = null;
    if (content) {
      const { calculateReadingTime } = await import("../../../lib/utils/readingTime.js");
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
        datePublished: datePublished ? new Date(datePublished) : status === "Published" ? new Date() : null,
      },
    });

    res.status(201).json(post);
  } catch (error) {
    handleApiError(error, res);
  }
};

// Refactored: Extract Method - Method routing extracted to reusable handler
export default createApiHandler({
  GET: handleGetRequest,
  POST: handlePostRequest,
});

