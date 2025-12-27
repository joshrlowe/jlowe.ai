/**
 * Calculate reading time in minutes from markdown content
 *
 * Extracted constants for better maintainability (Refactoring: Extract Constant)
 */
import { WORDS_PER_MINUTE, MIN_READING_TIME_MINUTES } from "./constants.js";

/**
 * Strips markdown syntax from content to get plain text
 * @private
 */
function stripMarkdown(content) {
  return content
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/`[^`]*`/g, "") // Remove inline code
    .replace(/\[([^\]]*)\]\([^\)]*\)/g, "$1") // Replace markdown links with link text
    .replace(/[#*_~`]/g, "") // Remove markdown formatting characters
    .replace(/\n+/g, " ") // Replace newlines with spaces
    .trim();
}

/**
 * Counts words in text
 * @private
 */
function countWords(text) {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Calculate reading time in minutes from markdown content
 * @param {string} content - Markdown content
 * @returns {number} Reading time in minutes (minimum 1)
 */
export function calculateReadingTime(content) {
  if (!content || typeof content !== "string") {
    return MIN_READING_TIME_MINUTES;
  }

  const plainText = stripMarkdown(content);
  const wordCount = countWords(plainText);
  const readingTime = Math.ceil(wordCount / WORDS_PER_MINUTE);

  return Math.max(MIN_READING_TIME_MINUTES, readingTime);
}
