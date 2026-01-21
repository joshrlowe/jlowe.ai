/**
 * Date formatting utilities
 *
 * Extracted to reduce duplication and improve consistency
 * 
 * Note: For date-only fields (startDate, releaseDate, dateObtained, etc.),
 * use formatDateUTC to avoid timezone issues where dates appear one day earlier.
 */

/**
 * Format a date string to a human-readable format (uses local timezone)
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
 * Format a date in UTC timezone (for date-only fields like startDate, releaseDate)
 * This prevents dates from appearing one day earlier due to timezone conversion.
 * @param {string|Date} dateString - ISO date string or Date object
 * @param {Object} options - Intl.DateTimeFormatOptions (timeZone will be forced to UTC)
 * @returns {string} Formatted date string in UTC
 */
export function formatDateUTC(dateString, options = {}) {
  if (!dateString) return "";
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  if (isNaN(date.getTime())) return "";
  
  const defaultOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  
  return date.toLocaleDateString("en-US", { 
    ...defaultOptions, 
    ...options, 
    timeZone: "UTC" 
  });
}

/**
 * Format month and year in UTC (for date-only fields)
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted date string (e.g., "January 2024") or "Present" if null
 */
export function formatMonthYearUTC(dateString) {
  if (!dateString) return "Present";
  return formatDateUTC(dateString, {
    month: "long",
    year: "numeric",
  });
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
 * Format a date for admin display (short format, uses UTC)
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatAdminDate(dateString) {
  return formatDateUTC(dateString, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date with time (uses local timezone - appropriate for timestamps)
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
 * Format a date for education/experience display (month and year only, uses UTC)
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted date string (e.g., "January 2024")
 */
export function formatMonthYear(dateString) {
  if (!dateString) return "Present";
  return formatDateUTC(dateString, {
    month: "long",
    year: "numeric",
  });
}

/**
 * Format a date for comment display (date + time with "at")
 * Uses local timezone since comments have timestamps
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
