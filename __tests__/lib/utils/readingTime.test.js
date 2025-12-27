/**
 * Tests for readingTime utility
 *
 * Following TDD principles: tests first, then refactor
 */
import { calculateReadingTime } from "@/lib/utils/readingTime";

describe("calculateReadingTime", () => {
  const WORDS_PER_MINUTE = 200; // Expected reading speed

  describe("edge cases", () => {
    it("should return 1 minute for empty string", () => {
      expect(calculateReadingTime("")).toBe(1);
    });

    it("should return 1 minute for null", () => {
      expect(calculateReadingTime(null)).toBe(1);
    });

    it("should return 1 minute for undefined", () => {
      expect(calculateReadingTime(undefined)).toBe(1);
    });

    it("should return 1 minute for non-string input", () => {
      expect(calculateReadingTime(123)).toBe(1);
      expect(calculateReadingTime({})).toBe(1);
      expect(calculateReadingTime([])).toBe(1);
    });
  });

  describe("basic word count", () => {
    it("should calculate reading time for simple text", () => {
      const text = "word ".repeat(200); // 200 words
      expect(calculateReadingTime(text)).toBe(1);
    });

    it("should round up to next minute", () => {
      const text = "word ".repeat(201); // 201 words
      expect(calculateReadingTime(text)).toBe(2); // Rounds up
    });

    it("should always return at least 1 minute", () => {
      const text = "one word";
      expect(calculateReadingTime(text)).toBe(1);
    });

    it("should handle exactly 200 words", () => {
      const text = "word ".repeat(200);
      expect(calculateReadingTime(text)).toBe(1);
    });

    it("should handle exactly 400 words", () => {
      const text = "word ".repeat(400);
      expect(calculateReadingTime(text)).toBe(2);
    });
  });

  describe("markdown syntax removal", () => {
    it("should remove code blocks", () => {
      const text = "```const x = 1;``` word ".repeat(200);
      // Should not count code block content
      expect(calculateReadingTime(text)).toBe(1);
    });

    it("should remove inline code", () => {
      const text = "This is `code` and normal text ".repeat(50);
      expect(calculateReadingTime(text)).toBeLessThanOrEqual(2);
    });

    it("should remove markdown links but keep link text", () => {
      const text = "[link text](https://example.com) word ".repeat(50);
      // Should count "link text word" not the URL
      expect(calculateReadingTime(text)).toBeLessThanOrEqual(2);
    });

    it("should remove markdown formatting characters", () => {
      const text = "# **bold** *italic* ~strikethrough~ word ".repeat(50);
      // Should not count formatting chars
      expect(calculateReadingTime(text)).toBeLessThanOrEqual(2);
    });

    it("should handle complex markdown", () => {
      const text = `
# Title
**Bold text** with [link](url) and \`code\`

\`\`\`
code block
\`\`\`

More text here.
      `.trim();
      const time = calculateReadingTime(text);
      expect(time).toBeGreaterThanOrEqual(1);
      expect(time).toBeLessThanOrEqual(2);
    });
  });

  describe("whitespace handling", () => {
    it("should handle multiple spaces", () => {
      const text = "word    word    word".repeat(70);
      expect(calculateReadingTime(text)).toBe(1);
    });

    it("should handle newlines", () => {
      const text = "word\nword\nword\n".repeat(70);
      expect(calculateReadingTime(text)).toBe(1);
    });

    it("should trim leading/trailing whitespace", () => {
      const text = "   " + "word ".repeat(200) + "   ";
      expect(calculateReadingTime(text)).toBe(1);
    });
  });
});
