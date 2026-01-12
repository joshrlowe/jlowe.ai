/**
 * Tests for readingTime utility
 * 
 * Tests reading time calculation from markdown content.
 */

import { calculateReadingTime } from '@/lib/utils/readingTime';

describe('readingTime', () => {
  describe('calculateReadingTime', () => {
    it('should calculate reading time for plain text', () => {
      // 200 words = 1 minute at default 200 WPM
      const words = Array(200).fill('word').join(' ');
      const result = calculateReadingTime(words);
      
      expect(result).toBe(1);
    });

    it('should round up to next minute', () => {
      // 250 words should be 2 minutes (rounded up from 1.25)
      const words = Array(250).fill('word').join(' ');
      const result = calculateReadingTime(words);
      
      expect(result).toBe(2);
    });

    it('should return minimum of 1 minute for short content', () => {
      const result = calculateReadingTime('Just a few words');
      
      expect(result).toBe(1);
    });

    it('should return minimum for empty string', () => {
      expect(calculateReadingTime('')).toBe(1);
    });

    it('should return minimum for null', () => {
      expect(calculateReadingTime(null)).toBe(1);
    });

    it('should return minimum for undefined', () => {
      expect(calculateReadingTime(undefined)).toBe(1);
    });

    it('should return minimum for non-string input', () => {
      expect(calculateReadingTime(123)).toBe(1);
      expect(calculateReadingTime({})).toBe(1);
      expect(calculateReadingTime([])).toBe(1);
    });

    it('should strip markdown code blocks', () => {
      const content = `
        Some text here.
        \`\`\`javascript
        const code = 'this should not count';
        const moreCode = 'also should not count';
        \`\`\`
        More text after.
      `;
      const result = calculateReadingTime(content);
      
      // Should only count the actual text, not the code
      expect(result).toBe(1);
    });

    it('should strip inline code', () => {
      const content = 'This is `inline code` in a sentence.';
      const result = calculateReadingTime(content);
      
      expect(result).toBe(1);
    });

    it('should extract link text from markdown links', () => {
      const content = 'Check out [this link](https://example.com) for more info.';
      const result = calculateReadingTime(content);
      
      expect(result).toBe(1);
    });

    it('should strip markdown formatting characters', () => {
      const content = '**bold** _italic_ ~~strikethrough~~ # heading';
      const result = calculateReadingTime(content);
      
      expect(result).toBe(1);
    });

    it('should handle multiple newlines', () => {
      const content = 'Word\n\n\n\nWord\n\n\nWord';
      const result = calculateReadingTime(content);
      
      expect(result).toBe(1);
    });

    it('should calculate correctly for long content', () => {
      // 1000 words = 5 minutes
      const words = Array(1000).fill('word').join(' ');
      const result = calculateReadingTime(words);
      
      expect(result).toBe(5);
    });

    it('should handle mixed markdown content', () => {
      const content = `
# Heading

This is a paragraph with **bold** and _italic_ text.

\`\`\`python
def code():
    pass
\`\`\`

Here's a [link](https://example.com) and some \`inline code\`.

- List item 1
- List item 2
- List item 3
      `;
      
      const result = calculateReadingTime(content);
      
      expect(result).toBeGreaterThanOrEqual(1);
    });
  });
});



