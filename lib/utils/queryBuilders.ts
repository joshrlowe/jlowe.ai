/**
 * Database Query Builder Utilities
 *
 * Common query patterns extracted for Prisma query construction.
 */

import { buildSearchFilter, removeUndefined } from "./apiHelpers";

interface PostWhereFilters {
  status?: string;
  topic?: string;
  search?: string;
  tags?: string | string[];
}

interface ProjectWhereFilters {
  status?: string;
  search?: string;
  tags?: string | string[];
  featured?: boolean;
}

interface PostQueryParams {
  where: Record<string, unknown>;
  orderBy: Record<string, string>;
  limit?: number;
  offset?: number;
  includeCounts?: boolean;
}

interface ProjectQueryParams {
  where: Record<string, unknown>;
  orderBy: Record<string, string>;
  limit?: number;
  offset?: number;
  includeTeam?: boolean;
}

/**
 * Builds a Prisma where clause for posts with filters
 */
export function buildPostWhereClause({
  status,
  topic,
  search,
  tags,
}: PostWhereFilters): Record<string, unknown> {
  return removeUndefined({
    status: status === "all" ? undefined : status,
    ...(topic && { topic: topic.toLowerCase() }),
    ...buildSearchFilter(search, ["title", "description", "content"]),
    ...(tags && {
      tags: {
        hasSome: Array.isArray(tags) ? tags : [tags],
      },
    }),
  });
}

/**
 * Builds a Prisma where clause for projects with filters
 */
export function buildProjectWhereClause({
  status,
  search,
  tags,
  featured,
}: ProjectWhereFilters): Record<string, unknown> {
  return removeUndefined({
    ...(status && status !== "all" ? { status } : {}),
    ...buildSearchFilter(search, ["title", "description", "shortDescription"]),
    ...(tags && {
      tags: {
        hasSome: Array.isArray(tags) ? tags : [tags],
      },
    }),
    ...(featured !== undefined ? { featured } : {}),
  });
}

/**
 * Builds include clause for posts with counts
 */
export function buildPostIncludeClause(
  includeCounts = true,
): Record<string, unknown> {
  if (!includeCounts) {
    return {};
  }

  return {
    _count: {
      select: {
        comments: true,
        likes: true,
      },
    },
  };
}

/**
 * Builds include clause for projects with team members
 */
export function buildProjectIncludeClause(
  includeTeam = true,
): Record<string, unknown> {
  if (!includeTeam) {
    return {};
  }

  return {
    teamMembers: true,
  };
}

/**
 * Builds a complete Prisma query for posts
 */
export function buildPostQuery({
  where,
  orderBy,
  limit,
  offset,
  includeCounts = true,
}: PostQueryParams): Record<string, unknown> {
  return {
    where,
    orderBy,
    ...(limit ? { take: limit } : {}),
    ...(offset ? { skip: offset } : {}),
    include: buildPostIncludeClause(includeCounts),
  };
}

/**
 * Builds a complete Prisma query for projects
 */
export function buildProjectQuery({
  where,
  orderBy,
  limit,
  offset,
  includeTeam = true,
}: ProjectQueryParams): Record<string, unknown> {
  return {
    where,
    orderBy,
    ...(limit ? { take: limit } : {}),
    ...(offset ? { skip: offset } : {}),
    include: buildProjectIncludeClause(includeTeam),
  };
}
