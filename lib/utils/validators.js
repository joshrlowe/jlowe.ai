/**
 * Validation Utilities
 * 
 * Following Martin Fowler's refactoring principles:
 * - Extract Method: Common validation logic extracted
 * - Single Responsibility: Each function validates one thing
 */

/**
 * Validates required fields in an object
 * 
 * @param {Object} data - Object to validate
 * @param {string[]} requiredFields - Array of required field names
 * @returns {{ isValid: boolean, message?: string }}
 */
export function validateRequiredFields(data, requiredFields) {
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
 * 
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field (for error message)
 * @returns {{ isValid: boolean, message?: string }}
 */
export function validateArrayField(value, fieldName) {
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
 * 
 * @param {Object} data - Object containing arrays to validate
 * @param {string[]} arrayFields - Array of field names that must be arrays
 * @returns {{ isValid: boolean, message?: string }}
 */
export function validateArrayFields(data, arrayFields) {
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
 * 
 * @param {...{ isValid: boolean, message?: string }} validations - Validation results
 * @returns {{ isValid: boolean, message?: string }}
 */
export function combineValidations(...validations) {
  for (const validation of validations) {
    if (!validation.isValid) {
      return validation;
    }
  }
  
  return { isValid: true };
}

