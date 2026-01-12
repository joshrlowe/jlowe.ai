/**
 * Utility functions for handling JSON fields and MongoDB-specific field cleanup.
 */

/**
 * Deep clones an object by serializing and deserializing JSON.
 * This ensures we get a plain object without any special MongoDB fields or methods.
 */
export function deepClone(obj) {
  if (!obj) return null;
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Recursively removes MongoDB-specific fields (_id, __v) from an object.
 */
function removeMongoFields(o) {
  if (Array.isArray(o)) {
    return o.map(removeMongoFields);
  }

  if (o && typeof o === "object") {
    const { _id, __v, ...rest } = o;
    const result = {};
    for (const [key, value] of Object.entries(rest)) {
      result[key] = removeMongoFields(value);
    }
    return result;
  }

  return o;
}

/**
 * Cleans MongoDB-specific fields from an object while preserving structure.
 */
export function cleanMongoFields(obj) {
  if (!obj) return null;
  return removeMongoFields(deepClone(obj));
}

/**
 * Safely parses a JSON field that may be a string, array, or object.
 * Commonly used for database fields that store JSON data.
 *
 * @param {string|Array|Object} field - The field to parse
 * @param {*} defaultValue - Default value if parsing fails or field is empty
 * @returns {*} Parsed value or default
 */
export function parseJsonField(field, defaultValue = []) {
  if (!field) return defaultValue;

  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch {
      return defaultValue;
    }
  }

  if (Array.isArray(field)) {
    return field;
  }

  if (typeof field === "object") {
    return field;
  }

  return defaultValue;
}
