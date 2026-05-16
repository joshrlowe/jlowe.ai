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

export default createApiHandler({
  GET: handleGetRequest,
});
