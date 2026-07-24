/**
 * Validation Utilities
 *
 * Common validation logic extracted for reuse across API routes.
 */

import type { ValidationResult } from "../types";

/**
 * Validates required fields in an object
 */
export function validateRequiredFields(
  data: Record<string, unknown>,
  requiredFields: string[]
): ValidationResult {
  const missing = requiredFields.filter((field) => !data[field]);

  if (missing.length > 0) {
    return {
      isValid: false,
      message: `Missing required fields: ${missing.join(", ")}`,
    };
  }

  return { isValid: true };
}

/**
 * Validates that a field is an array
 */
export function validateArrayField(value: unknown, fieldName: string): ValidationResult {
  if (!Array.isArray(value)) {
    return {
      isValid: false,
      message: `${fieldName} must be an array`,
    };
  }

  return { isValid: true };
}

/**
 * Validates multiple array fields
 */
export function validateArrayFields(
  data: Record<string, unknown>,
  arrayFields: string[]
): ValidationResult {
  for (const field of arrayFields) {
    const validation = validateArrayField(data[field], field);
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true };
}

/**
 * Combines multiple validations
 */
export function combineValidations(...validations: ValidationResult[]): ValidationResult {
  for (const validation of validations) {
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true };
}

export function validateEmail(email: unknown): ValidationResult {
  if (typeof email !== "string" || email.length === 0) {
    return { isValid: false, message: "Email is required" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 254) {
    return { isValid: false, message: "Invalid email format" };
  }
  return { isValid: true };
}

export function validateMaxLength(value: unknown, field: string, max: number): ValidationResult {
  if (typeof value === "string" && value.length > max) {
    return {
      isValid: false,
      message: `${field} must be ${max} characters or fewer`,
    };
  }
  return { isValid: true };
}
