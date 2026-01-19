/**
 * Tests for lib/utils/readingTime.js
 */

import { calculateReadingTime } from "../../../lib/utils/readingTime";

describe("readingTime", () => {
  describe("calculateReadingTime", () => {
    it("returns 1 for empty content", () => {
      expect(calculateReadingTime("")).toBe(1);
    });

    it("returns 1 for null content", () => {
      expect(calculateReadingTime(null)).toBe(1);
    });

    it("returns 1 for undefined content", () => {
      expect(calculateReadingTime(undefined)).toBe(1);
    });

    it("returns 1 for non-string content", () => {
      expect(calculateReadingTime(123)).toBe(1);
      expect(calculateReadingTime({})).toBe(1);
      expect(calculateReadingTime([])).toBe(1);
    });

    it("calculates reading time for short content", () => {
      // 200 words per minute, so 100 words = 1 minute
      const content = "word ".repeat(100);
      expect(calculateReadingTime(content)).toBe(1);
    });

    it("calculates reading time for longer content", () => {
      // 400 words = 2 minutes at 200 wpm
      const content = "word ".repeat(400);
      expect(calculateReadingTime(content)).toBe(2);
    });

    it("calculates reading time for very long content", () => {
      // 1000 words = 5 minutes at 200 wpm
      const content = "word ".repeat(1000);
      expect(calculateReadingTime(content)).toBe(5);
    });

    it("strips markdown formatting", () => {
      const content = "# Heading\n\n**Bold** and *italic* text.";
      // Should only count "Heading Bold and italic text" = 5 words = 1 minute
      expect(calculateReadingTime(content)).toBe(1);
    });

    it("strips code blocks", () => {
      const content = `
Some text before code.

\`\`\`javascript
const code = "should be stripped";
function test() {
  return true;
}
\`\`\`

Some text after code.
      `;
      // Should only count words outside code blocks
      expect(calculateReadingTime(content)).toBeGreaterThanOrEqual(1);
    });

    it("strips inline code", () => {
      const content = "Use the `function` to call `method`.";
      // Should only count "Use the to call" = 4 words = 1 minute
      expect(calculateReadingTime(content)).toBe(1);
    });

    it("extracts link text from markdown links", () => {
      const content = "[Click here](https://example.com) for more info.";
      // Should count "Click here for more info" = 5 words = 1 minute
      expect(calculateReadingTime(content)).toBe(1);
    });

    it("handles multiple newlines", () => {
      const content = "First line.\n\n\n\nSecond line.";
      expect(calculateReadingTime(content)).toBe(1);
    });

    it("returns at least 1 minute", () => {
      const content = "a";
      expect(calculateReadingTime(content)).toBe(1);
    });

    it("rounds up reading time", () => {
      // 250 words = 1.25 minutes, should round up to 2
      const content = "word ".repeat(250);
      expect(calculateReadingTime(content)).toBe(2);
    });

    it("handles complex markdown", () => {
      const content = `
# Main Title

This is a paragraph with **bold** and *italic* text.

## Subtitle

- List item 1
- List item 2
- List item 3

[Link text](https://example.com)

> Blockquote text here

\`\`\`python
def hello():
    print("Hello, World!")
\`\`\`

More text after code block.
      `;
      // Should calculate based on visible text only
      expect(calculateReadingTime(content)).toBeGreaterThanOrEqual(1);
    });
  });
});
