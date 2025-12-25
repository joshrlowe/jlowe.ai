/**
 * Database Query Builder Utilities
 * 
 * Following Martin Fowler's refactoring principles:
 * - Extract Method: Common query patterns extracted
 * - Single Responsibility: Each function builds one part of a query
 * - Preserve Behavior: Queries produce same results
 * 
 * @module queryBuilders
 */

import { buildSearchFilter, removeUndefined } from "./apiHelpers.js";

/**
 * Builds a Prisma where clause for posts with filters
 * 
 * @param {Object} filters - Filter parameters
 * @param {string} [filters.status] - Post status filter (e.g., "Published", "Draft", or "all")
 * @param {string} [filters.topic] - Topic filter (will be lowercased)
 * @param {string} [filters.search] - Search query to match against title, description, content
 * @param {string|Array<string>} [filters.tags] - Tag filter(s) - can be single tag or array
 * @returns {Object} Prisma where clause object
 * @example
 * const where = buildPostWhereClause({
 *   status: "Published",
 *   topic: "React",
 *   search: "hooks",
 *   tags: ["javascript", "react"]
 * });
 */
export function buildPostWhereClause({ status, topic, search, tags }) {
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
 * 
 * @param {Object} filters - Filter parameters
 * @param {string} [filters.status] - Project status filter (or "all" to include all statuses)
 * @param {string} [filters.search] - Search query to match against title, description
 * @param {string|Array<string>} [filters.tags] - Tag filter(s)
 * @param {boolean} [filters.featured] - Featured filter (true/false)
 * @returns {Object} Prisma where clause object
 */
export function buildProjectWhereClause({ status, search, tags, featured }) {
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
 * 
 * @param {boolean} includeCounts - Whether to include comment/like counts
 * @returns {Object} Prisma include clause
 */
export function buildPostIncludeClause(includeCounts = true) {
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
 * 
 * @param {boolean} includeTeam - Whether to include team members
 * @returns {Object} Prisma include clause
 */
export function buildProjectIncludeClause(includeTeam = true) {
  if (!includeTeam) {
    return {};
  }

  return {
    teamMembers: true,
  };
}

/**
 * Builds a complete Prisma query for posts with filters, sorting, and pagination
 * 
 * @param {Object} params - Query parameters
 * @param {Object} params.where - Where clause
 * @param {Object} params.orderBy - OrderBy clause
 * @param {number} params.limit - Limit (take)
 * @param {number} params.offset - Offset (skip)
 * @param {boolean} params.includeCounts - Include comment/like counts
 * @returns {Object} Complete Prisma query object
 */
export function buildPostQuery({ where, orderBy, limit, offset, includeCounts = true }) {
  return {
    where,
    orderBy,
    ...(limit ? { take: limit } : {}),
    ...(offset ? { skip: offset } : {}),
    include: buildPostIncludeClause(includeCounts),
  };
}

/**
 * Builds a complete Prisma query for projects with filters, sorting, and pagination
 * 
 * @param {Object} params - Query parameters
 * @param {Object} params.where - Where clause
 * @param {Object} params.orderBy - OrderBy clause
 * @param {number} params.limit - Limit (take)
 * @param {number} params.offset - Offset (skip)
 * @param {boolean} params.includeTeam - Include team members
 * @returns {Object} Complete Prisma query object
 */
export function buildProjectQuery({ where, orderBy, limit, offset, includeTeam = true }) {
  return {
    where,
    orderBy,
    ...(limit ? { take: limit } : {}),
    ...(offset ? { skip: offset } : {}),
    include: buildProjectIncludeClause(includeTeam),
  };
}

