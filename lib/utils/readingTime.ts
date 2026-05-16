/**
 * Calculate reading time in minutes from markdown content
 */
import { WORDS_PER_MINUTE, MIN_READING_TIME_MINUTES } from "./constants";

/**
 * Strips markdown syntax from content to get plain text
 */
function stripMarkdown(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/`[^`]*`/g, "") // Remove inline code
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // Replace markdown links with link text
    .replace(/[#*_~`]/g, "") // Remove markdown formatting characters
    .replace(/\n+/g, " ") // Replace newlines with spaces
    .trim();
}

/**
 * Counts words in text
 */
function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Calculate reading time in minutes from markdown content
 */
export function calculateReadingTime(content: string): number {
  if (!content || typeof content !== "string") {
    return MIN_READING_TIME_MINUTES;
  }

  const plainText = stripMarkdown(content);
  const wordCount = countWords(plainText);
  const readingTime = Math.ceil(wordCount / WORDS_PER_MINUTE);

  return Math.max(MIN_READING_TIME_MINUTES, readingTime);
}
