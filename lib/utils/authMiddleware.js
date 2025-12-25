/**
 * Authentication Middleware Utilities
 * 
 * Following Martin Fowler's refactoring principles:
 * - Extract Method: Common auth pattern extracted
 * - Single Responsibility: Each function handles one concern
 */

import { getToken } from "next-auth/jwt";
import { getConfigValue } from "../config.js";

/**
 * Creates an authenticated API handler wrapper
 * 
 * @param {Function} handler - The actual API handler function
 * @returns {Function} Wrapped handler that checks authentication first
 */
export function withAuth(handler) {
  return async (req, res) => {
    const token = await getToken({
      req,
      secret: getConfigValue("nextAuthSecret"),
    });

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return handler(req, res, token);
  };
}

/**
 * Gets user ID from token
 * 
 * @param {Object} token - NextAuth token object
 * @returns {string} User identifier (email or 'unknown')
 */
export function getUserIdFromToken(token) {
  return token.email || token.name || "unknown";
}

