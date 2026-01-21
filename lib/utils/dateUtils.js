/**
 * Date formatting utilities
 *
 * Extracted to reduce duplication and improve consistency
 */

/**
 * Format a date string to a human-readable format
 * @param {string|Date} dateString - ISO date string or Date object
 * @param {Object} options - Intl.DateTimeFormatOptions
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, options = {}) {
  if (!dateString) return "";

  const date = dateString instanceof Date ? dateString : new Date(dateString);

  if (isNaN(date.getTime())) return "";

  const defaultOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };

  return date.toLocaleDateString("en-US", { ...defaultOptions, ...options });
}

/**
 * Format a date for article display (long format)
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted date string (e.g., "January 15, 2024")
 */
export function formatArticleDate(dateString) {
  return formatDate(dateString);
}

/**
 * Format a date for admin display (short format)
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatAdminDate(dateString) {
  return formatDate(dateString, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date with time
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted date string with time
 */
export function formatDateTime(dateString) {
  return formatDate(dateString, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format a date for education/experience display (month and year only)
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted date string (e.g., "January 2024")
 */
export function formatMonthYear(dateString) {
  if (!dateString) return "Present";
  return formatDate(dateString, {
    month: "long",
    year: "numeric",
  });
}

/**
 * Format a date for UTC display (for project timelines)
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted date string in UTC
 */
export function formatDateUTC(dateString) {
  if (!dateString) return "";
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
  });
}

/**
 * Format a date for comment display (date + time with "at")
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted date string (e.g., "Jan 15, 2024 at 3:45 PM")
 */
export function formatCommentDate(dateString) {
  if (!dateString) return "";
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const dateFormatted = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeFormatted = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${dateFormatted} at ${timeFormatted}`;
}
