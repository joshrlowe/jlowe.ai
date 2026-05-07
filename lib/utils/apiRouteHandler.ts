/**
 * API Route Handler Utilities
 *
 * Common patterns extracted to reusable functions for API route handling.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { handleApiError } from "./apiErrorHandler";
import type { ValidationResult } from "../types";

type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  ...args: unknown[]
) => Promise<void> | void;

interface HandlerMap {
  [method: string]: ApiHandler;
}

/**
 * Creates a standard API route handler with method routing
 */
export function createApiHandler(handlers: HandlerMap): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse, ...args: unknown[]) => {
    const handler = handlers[req.method as string];

    if (!handler) {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
      await handler(req, res, ...args);
    } catch (error) {
      handleApiError(error as Error, res);
    }
  };
}

/**
 * Creates a GET handler for fetching the latest single record
 */
export function createGetLatestHandler<T>(
  findLatestFn: () => Promise<T | null>,
  notFoundMessage = "Data not found",
): ApiHandler {
  return async (_req: NextApiRequest, res: NextApiResponse) => {
    try {
      const data = await findLatestFn();

      if (!data) {
        return res.status(404).json({ message: notFoundMessage });
      }

      res.json(data);
    } catch (error) {
      handleApiError(error as Error, res);
    }
  };
}

/**
 * Creates a POST handler for upserting (delete all + create) single record
 */
export function createUpsertHandler<T>(
  deleteAllFn: () => Promise<unknown>,
  createFn: (body: Record<string, unknown>) => Promise<T>,
  validateFn?: (body: Record<string, unknown>) => ValidationResult,
): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
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
      handleApiError(error as Error, res);
    }
  };
}
