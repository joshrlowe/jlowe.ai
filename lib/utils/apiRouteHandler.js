/**
 * API Route Handler Utilities
 *
 * Following Martin Fowler's refactoring principles:
 * - Extract Method: Common patterns extracted to reusable functions
 * - Preserve Behavior: All existing functionality maintained
 * - Small Steps: Each function handles one concern
 *
 * @module apiRouteHandler
 */

import { handleApiError } from "./apiErrorHandler.js";

/**
 * Creates a standard API route handler with method routing
 *
 * @param {Object<string, Function>} handlers - Object with method handlers (GET, POST, PUT, DELETE, etc.)
 * @returns {Function} Next.js API route handler
 * @example
 * export default createApiHandler({
 *   GET: async (req, res) => { res.json({ data: "value" }); },
 *   POST: async (req, res) => { res.status(201).json({ success: true }); }
 * });
 */
export function createApiHandler(handlers) {
  return async (req, res, ...args) => {
    const handler = handlers[req.method];

    if (!handler) {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
      await handler(req, res, ...args);
    } catch (error) {
      handleApiError(error, res);
    }
  };
}

/**
 * Creates a GET handler for fetching the latest single record
 *
 * @param {Function} findLatestFn - Function to find the latest record (returns Promise)
 * @param {string} [notFoundMessage="Data not found"] - Message to return when record not found
 * @returns {Function} GET handler function
 * @example
 * const handleGetRequest = createGetLatestHandler(
 *   () => prisma.welcome.findFirst({ orderBy: { createdAt: "desc" } }),
 *   "Welcome data not found"
 * );
 */
export function createGetLatestHandler(
  findLatestFn,
  notFoundMessage = "Data not found",
) {
  return async (req, res) => {
    try {
      const data = await findLatestFn();

      if (!data) {
        return res.status(404).json({ message: notFoundMessage });
      }

      res.json(data);
    } catch (error) {
      handleApiError(error, res);
    }
  };
}

/**
 * Creates a POST handler for upserting (delete all + create) single record
 *
 * @param {Function} deleteAllFn - Function to delete all existing records
 * @param {Function} createFn - Function to create new record (receives req.body)
 * @param {Function} [validateFn] - Optional function to validate req.body (returns { isValid, message })
 * @returns {Function} POST handler function
 * @example
 * const handlePostRequest = createUpsertHandler(
 *   () => prisma.welcome.deleteMany({}),
 *   (body) => prisma.welcome.create({ data: body }),
 *   (body) => validateRequiredFields(body, ["name", "briefBio"])
 * );
 */
export function createUpsertHandler(deleteAllFn, createFn, validateFn) {
  return async (req, res) => {
    try {
      // Validate
      if (validateFn) {
        const validation = validateFn(req.body);
        if (!validation.isValid) {
          return res
            .status(400)
            .json({ message: validation.message || "Validation failed" });
        }
      }

      // Delete all existing records
      await deleteAllFn();

      // Create new record
      const saved = await createFn(req.body);

      res.status(201).json(saved);
    } catch (error) {
      handleApiError(error, res);
    }
  };
}
