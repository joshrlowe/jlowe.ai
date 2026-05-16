/**
 * Utility functions for handling JSON fields and MongoDB-specific field cleanup.
 */

/**
 * Deep clones an object by serializing and deserializing JSON.
 * This ensures we get a plain object without any special MongoDB fields or methods.
 */
export function deepClone<T>(obj: T): T | null {
  if (!obj) return null;
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Recursively removes MongoDB-specific fields (_id, __v) from an object.
 */
function removeMongoFields(o: unknown): unknown {
  if (Array.isArray(o)) {
    return o.map(removeMongoFields);
  }

  if (o && typeof o === "object") {
    const { _id, __v, ...rest } = o as Record<string, unknown>;
    const result: Record<string, unknown> = {};
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
export function cleanMongoFields<T>(obj: T): T | null {
  if (!obj) return null;
  return removeMongoFields(deepClone(obj)) as T;
}

/**
 * Safely parses a JSON field that may be a string, array, or object.
 * Commonly used for database fields that store JSON data.
 */
export function parseJsonField<T = unknown>(
  field: string | T[] | Record<string, unknown> | null | undefined,
  defaultValue: T | T[] = []
): T | T[] {
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
    return field as T;
  }

  return defaultValue;
}
