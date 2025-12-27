/**
 * Common API helper functions
 */

/**
 * Parse pagination parameters from query
 */
export function parsePagination(query) {
  const limit = query.limit ? parseInt(query.limit, 10) : undefined;
  const offset = parseInt(query.offset || "0", 10);
  return { limit, offset };
}

/**
 * Parse sort parameters from query
 */
export function parseSort(
  query,
  defaultSortBy = "createdAt",
  defaultSortOrder = "desc",
) {
  const sortBy = query.sortBy || defaultSortBy;
  const sortOrder = query.sortOrder || defaultSortOrder;
  return { sortBy, sortOrder };
}

/**
 * Build Prisma orderBy object from sort parameters
 */
export function buildOrderBy(sortBy, sortOrder, fieldMap = {}) {
  const orderBy = {};
  const field = fieldMap[sortBy] || sortBy;
  orderBy[field] = sortOrder;
  return orderBy;
}

/**
 * Build search filter for Prisma
 */
export function buildSearchFilter(search, fields = ["title", "description"]) {
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
export function removeUndefined(obj) {
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(body, requiredFields) {
  const missing = requiredFields.filter((field) => !body[field]);
  if (missing.length > 0) {
    return {
      isValid: false,
      message: `Missing required fields: ${missing.join(", ")}`,
    };
  }
  return { isValid: true };
}

/**
 * Format paginated response
 *
 * @param {Array} data - Array of items to return
 * @param {number} total - Total count of items
 * @param {number} limit - Limit (items per page)
 * @param {number} offset - Offset (skip count)
 * @param {string} dataKey - Optional key name for data array (defaults to auto-detect)
 * @returns {Object} Formatted paginated response
 */
export function formatPaginatedResponse(
  data,
  total,
  limit,
  offset,
  dataKey = null,
) {
  // Refactored: Extract Method - Data key determination extracted
  let key = dataKey;
  if (!key) {
    if (!Array.isArray(data) || data.length === 0) {
      key = "items";
    } else {
      // Auto-detect based on data structure
      key = data[0].playlistPosts ? "playlists" : "posts";
    }
  }

  return {
    [key]: data,
    total,
    limit: limit || data.length,
    offset,
  };
}
