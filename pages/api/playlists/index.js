import prisma from "../../../lib/prisma.js";
import { createApiHandler } from "../../../lib/utils/apiRouteHandler.js";
import { handleApiError } from "../../../lib/utils/apiErrorHandler.js";
import {
  parsePagination,
  parseSort,
  buildOrderBy,
  removeUndefined,
  formatPaginatedResponse,
} from "../../../lib/utils/apiHelpers.js";
import { validateRequiredFields } from "../../../lib/utils/validators.js";

const handleGetRequest = async (req, res) => {
  try {
    const { featured } = req.query;
    const { limit, offset } = parsePagination(req.query);
    const { sortBy, sortOrder } = parseSort(req.query, "order", "asc");

    const where = removeUndefined({
      ...(featured !== undefined && { featured: featured === "true" }),
    });

    const orderBy = buildOrderBy(sortBy, sortOrder, {
      order: "order",
      title: "title",
      createdAt: "createdAt",
    });

    const playlists = await prisma.playlist.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        playlistPosts: {
          include: {
            post: true,
          },
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            playlistPosts: true,
          },
        },
      },
    });

    const total = await prisma.playlist.count({ where });

    res.json(
      formatPaginatedResponse(playlists, total, limit, offset, "playlists"),
    );
  } catch (error) {
    handleApiError(error, res);
  }
};

// Refactored: Extract Method - POST handler extracted
const handlePostRequest = async (req, res) => {
  try {
    const { title, description, slug, coverImage, featured, order, postIds } =
      req.body;

    // Refactored: Extract Method - Validation extracted
    const validation = validateRequiredFields(req.body, ["title", "slug"]);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    const playlist = await prisma.playlist.create({
      data: {
        title,
        description: description || null,
        slug,
        coverImage: coverImage || null,
        featured: featured || false,
        order: order || 0,
        ...(postIds &&
          postIds.length > 0 && {
            playlistPosts: {
              create: postIds.map((postId, index) => ({
                postId,
                order: index,
              })),
            },
          }),
      },
      include: {
        playlistPosts: {
          include: {
            post: true,
          },
        },
      },
    });

    res.status(201).json(playlist);
  } catch (error) {
    handleApiError(error, res);
  }
};

// Refactored: Extract Method - Method routing extracted to reusable handler
export default createApiHandler({
  GET: handleGetRequest,
  POST: handlePostRequest,
});
