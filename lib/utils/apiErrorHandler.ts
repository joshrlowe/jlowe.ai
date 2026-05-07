/**
 * Centralized error handling for API routes.
 * Provides consistent error responses across all endpoints.
 */

import type { NextApiResponse } from "next";
import { isDevelopment } from "../config";
import type { ErrorResponse } from "../types";

interface PrismaError extends Error {
  code: string;
  meta?: { target?: string[] };
}

interface ApiError extends Error {
  code?: string;
  meta?: unknown;
  statusCode?: number;
  details?: unknown;
}

/**
 * Maps Prisma error codes to HTTP status codes
 */
function getPrismaErrorStatus(code: string): number {
  const errorMap: Record<string, number> = {
    P2002: 409, // Unique constraint violation
    P2003: 400, // Foreign key constraint violation
    P2025: 404, // Record not found
    P2014: 400, // Invalid ID
    P2000: 400, // Value too long
    P2001: 404, // Record does not exist
  };

  return errorMap[code] || 400;
}

/**
 * Formats Prisma error for API response
 */
function formatPrismaError(error: PrismaError): ErrorResponse {
  const _statusCode = getPrismaErrorStatus(error.code);

  let message = "Database error occurred";

  if (error.code === "P2002") {
    const field = error.meta?.target?.[0] || "field";
    message = `A record with this ${field} already exists`;
  } else if (error.code === "P2025") {
    message = "Record not found";
  } else if (error.code === "P2003") {
    message = "Invalid reference: related record does not exist";
  } else if (error.message) {
    message = error.message;
  }

  return {
    message,
    code: error.code,
    ...(isDevelopment() && { details: error.meta }),
  };
}

/**
 * Formats validation error for API response
 */
function formatValidationError(error: ApiError): ErrorResponse {
  return {
    message: error.message || "Validation failed",
    code: "VALIDATION_ERROR",
    ...(isDevelopment() && { details: error.details }),
  };
}

/**
 * Formats authentication error for API response
 */
function formatAuthError(error: ApiError): ErrorResponse {
  return {
    message: "Unauthorized",
    code: "UNAUTHORIZED",
    ...(isDevelopment() && { details: error.message }),
  };
}

/**
 * Handles API errors and sends appropriate response
 */
export function handleApiError(error: ApiError, res: NextApiResponse): void {
  // Log error for debugging
  if (isDevelopment()) {
    console.error("API Error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
    });
  } else {
    console.error("API Error:", error.message);
  }

  // Handle Prisma errors
  if (error.code && error.code.startsWith("P")) {
    const errorResponse = formatPrismaError(error as PrismaError);
    const statusCode = getPrismaErrorStatus(error.code);
    res.status(statusCode).json(errorResponse);
    return;
  }

  // Handle validation errors
  if (error.name === "ValidationError" || error.code === "VALIDATION_ERROR") {
    const errorResponse = formatValidationError(error);
    res.status(400).json(errorResponse);
    return;
  }

  // Handle authentication errors
  if (error.name === "UnauthorizedError" || error.statusCode === 401) {
    const errorResponse = formatAuthError(error);
    res.status(401).json(errorResponse);
    return;
  }

  // Handle generic errors with status codes
  if (error.statusCode) {
    res.status(error.statusCode).json({
      message: error.message || "An error occurred",
      code: error.code || "ERROR",
      ...(isDevelopment() && { details: error.stack }),
    });
    return;
  }

  // Default to 500 Internal Server Error
  res.status(500).json({
    message: "Internal Server Error",
    code: "INTERNAL_ERROR",
    ...(isDevelopment() && {
      details: {
        message: error.message,
        stack: error.stack,
      },
    }),
  });
}
