/**
 * Centralized error handling for API routes.
 * Provides consistent error responses across all endpoints.
 *
 * @typedef {Object} ErrorResponse
 * @property {string} message - Error message
 * @property {string} [code] - Error code
 * @property {any} [details] - Additional error details (development only)
 */

import { isDevelopment } from "../config.js";

/**
 * Maps Prisma error codes to HTTP status codes
 *
 * @param {string} code - Prisma error code
 * @returns {number} HTTP status code
 */
function getPrismaErrorStatus(code) {
  const errorMap = {
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
 *
 * @param {Error} error - Prisma error
 * @returns {ErrorResponse} Formatted error response
 */
function formatPrismaError(error) {
  const _statusCode = getPrismaErrorStatus(error.code);

  let message = "Database error occurred";

  if (error.code === "P2002") {
    // Extract field name from meta.target if available
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
 *
 * @param {Error} error - Validation error
 * @returns {ErrorResponse} Formatted error response
 */
function formatValidationError(error) {
  return {
    message: error.message || "Validation failed",
    code: "VALIDATION_ERROR",
    ...(isDevelopment() && { details: error.details }),
  };
}

/**
 * Formats authentication error for API response
 *
 * @param {Error} error - Authentication error
 * @returns {ErrorResponse} Formatted error response
 */
function formatAuthError(error) {
  return {
    message: "Unauthorized",
    code: "UNAUTHORIZED",
    ...(isDevelopment() && { details: error.message }),
  };
}

/**
 * Handles API errors and sends appropriate response
 *
 * @param {Error} error - The error object
 * @param {import('next').NextApiResponse} res - Next.js API response object
 */
export function handleApiError(error, res) {
  // Log error for debugging (only in development or if logging service available)
  if (isDevelopment()) {
    console.error("API Error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
    });
  } else {
    // In production, you might want to send to error tracking service
    // TODO: Integrate with error tracking service (e.g., Sentry)
    console.error("API Error:", error.message);
  }

  // Handle Prisma errors
  if (error.code && error.code.startsWith("P")) {
    const errorResponse = formatPrismaError(error);
    const statusCode = getPrismaErrorStatus(error.code);
    return res.status(statusCode).json(errorResponse);
  }

  // Handle validation errors
  if (error.name === "ValidationError" || error.code === "VALIDATION_ERROR") {
    const errorResponse = formatValidationError(error);
    return res.status(400).json(errorResponse);
  }

  // Handle authentication errors
  if (error.name === "UnauthorizedError" || error.statusCode === 401) {
    const errorResponse = formatAuthError(error);
    return res.status(401).json(errorResponse);
  }

  // Handle generic errors with status codes
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      message: error.message || "An error occurred",
      code: error.code || "ERROR",
      ...(isDevelopment() && { details: error.stack }),
    });
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
