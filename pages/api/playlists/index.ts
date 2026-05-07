import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { createApiHandler } from "../../../lib/utils/apiRouteHandler";
import { handleApiError } from "../../../lib/utils/apiErrorHandler";
import {
  parsePagination,
  parseSort,
  buildOrderBy,
  removeUndefined,
  formatPaginatedResponse,
} from "../../../lib/utils/apiHelpers";
import { validateRequiredFields } from "../../../lib/utils/validators";

const handleGetRequest = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { featured } = req.query;
    const { limit, offset } = parsePagination(req.query as Record<string, string>);
    const { sortBy, sortOrder } = parseSort(req.query as Record<string, string>, "order", "asc");

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
    handleApiError(error as Error, res);
  }
};

const handlePostRequest = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { title, description, slug, coverImage, featured, order, postIds } =
      req.body;

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
            create: postIds.map((postId: string, index: number) => ({
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
    handleApiError(error as Error, res);
  }
};

export default createApiHandler({
  GET: handleGetRequest,
  POST: handlePostRequest,
});
