/**
 * Date formatting utilities
 *
 * Extracted to reduce duplication and improve consistency
 *
 * Note: For date-only fields (startDate, releaseDate, dateObtained, etc.),
 * use formatDateUTC to avoid timezone issues where dates appear one day earlier.
 */

type DateInput = string | Date;

/**
 * Format a date string to a human-readable format (uses local timezone)
 */
export function formatDate(
  dateString: DateInput,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!dateString) return "";

  const date = dateString instanceof Date ? dateString : new Date(dateString);

  if (isNaN(date.getTime())) return "";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };

  return date.toLocaleDateString("en-US", { ...defaultOptions, ...options });
}

/**
 * Format a date in UTC timezone (for date-only fields like startDate, releaseDate)
 * This prevents dates from appearing one day earlier due to timezone conversion.
 */
export function formatDateUTC(
  dateString: DateInput,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!dateString) return "";
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };

  return date.toLocaleDateString("en-US", {
    ...defaultOptions,
    ...options,
    timeZone: "UTC",
  });
}

/**
 * Format month and year in UTC (for date-only fields)
 */
export function formatMonthYearUTC(dateString: DateInput): string {
  if (!dateString) return "Present";
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Format a date for article display (long format)
 */
export function formatArticleDate(dateString: DateInput): string {
  return formatDate(dateString);
}

/**
 * Format a date for admin display (short format, uses UTC)
 */
export function formatAdminDate(dateString: DateInput): string {
  return formatDateUTC(dateString, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date with time (uses local timezone - appropriate for timestamps)
 */
export function formatDateTime(dateString: DateInput): string {
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
 */
export function formatMonthYear(dateString: DateInput): string {
  if (!dateString) return "Present";
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Format a date for comment display (date + time with "at")
 * Uses local timezone since comments have timestamps
 */
export function formatCommentDate(dateString: DateInput): string {
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
