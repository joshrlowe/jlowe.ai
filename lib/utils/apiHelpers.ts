/**
 * Common API helper functions
 */

import type { PaginationParams, SortParams } from "../types";

interface QueryParams {
  limit?: string;
  offset?: string;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
  [key: string]: string | string[] | undefined;
}

/**
 * Parse pagination parameters from query
 */
export function parsePagination(query: QueryParams): PaginationParams {
  const limit = query.limit ? parseInt(query.limit, 10) : undefined;
  const offset = parseInt(query.offset || "0", 10);
  return { limit, offset };
}

/**
 * Parse sort parameters from query
 */
export function parseSort(
  query: QueryParams,
  defaultSortBy = "createdAt",
  defaultSortOrder = "desc",
): SortParams {
  const sortBy = (query.sortBy as string) || defaultSortBy;
  const sortOrder = (query.sortOrder as string) || defaultSortOrder;
  return { sortBy, sortOrder };
}

/**
 * Build Prisma orderBy object from sort parameters
 */
export function buildOrderBy(
  sortBy: string,
  sortOrder: string,
  fieldMap: Record<string, string> = {},
): Record<string, string> {
  const orderBy: Record<string, string> = {};
  const field = fieldMap[sortBy] || sortBy;
  orderBy[field] = sortOrder;
  return orderBy;
}

/**
 * Build search filter for Prisma
 */
export function buildSearchFilter(
  search: string | undefined,
  fields: string[] = ["title", "description"],
): Record<string, unknown> {
  if (!search) return {};

  return {
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: "insensitive" },
    })),
  };
}

/**
 * Remove undefined values from object
 */
export function removeUndefined<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
}

// Re-export validateRequiredFields from validators for backward compatibility
export { validateRequiredFields } from "./validators";

/**
 * Format paginated response
 */
export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  limit: number | undefined,
  offset: number,
  dataKey: string | null = null,
): Record<string, unknown> {
  let key = dataKey;
  if (!key) {
    if (!Array.isArray(data) || data.length === 0) {
      key = "items";
    } else {
      key = (data[0] as Record<string, unknown>).playlistPosts ? "playlists" : "posts";
    }
  }

  return {
    [key]: data,
    total,
    limit: limit || data.length,
    offset,
  };
}
