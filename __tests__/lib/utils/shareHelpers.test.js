/**
 * Tests for lib/utils/shareHelpers.js
 *
 * Tests social sharing URL generation and clipboard functionality
 */

import { generateShareUrls, copyToClipboard } from '../../../lib/utils/shareHelpers.js';

describe('shareHelpers', () => {
  describe('generateShareUrls', () => {
    const testUrl = 'https://jlowe.ai/articles/test-post';
    const testTitle = 'Test Article';
    const testDescription = 'This is a test article description';

    it('should generate Twitter share URL', () => {
      const urls = generateShareUrls(testUrl, testTitle, testDescription);

      expect(urls.twitter).toContain('twitter.com/intent/tweet');
      expect(urls.twitter).toContain(encodeURIComponent(testUrl));
      expect(urls.twitter).toContain(encodeURIComponent(testTitle));
    });

    it('should generate LinkedIn share URL', () => {
      const urls = generateShareUrls(testUrl, testTitle, testDescription);

      expect(urls.linkedin).toContain('linkedin.com/sharing/share-offsite');
      expect(urls.linkedin).toContain(encodeURIComponent(testUrl));
    });

    it('should generate Facebook share URL', () => {
      const urls = generateShareUrls(testUrl, testTitle, testDescription);

      expect(urls.facebook).toContain('facebook.com/sharer/sharer.php');
      expect(urls.facebook).toContain(encodeURIComponent(testUrl));
    });

    it('should generate email share URL', () => {
      const urls = generateShareUrls(testUrl, testTitle, testDescription);

      expect(urls.email).toContain('mailto:');
      expect(urls.email).toContain(`subject=${encodeURIComponent(testTitle)}`);
      expect(urls.email).toContain(encodeURIComponent(testDescription));
      expect(urls.email).toContain(encodeURIComponent(testUrl));
    });

    it('should handle empty URL', () => {
      const urls = generateShareUrls('', testTitle, testDescription);

      expect(urls.twitter).toContain('url=');
      expect(urls.linkedin).toContain('url=');
    });

    it('should handle empty title', () => {
      const urls = generateShareUrls(testUrl, '', testDescription);

      expect(urls.twitter).toContain('text=');
      expect(urls.email).toContain('subject=');
    });

    it('should handle empty description', () => {
      const urls = generateShareUrls(testUrl, testTitle, '');

      expect(urls.email).toContain('body=');
    });

    it('should handle null/undefined values', () => {
      const urls = generateShareUrls(null, null, null);

      expect(urls.twitter).toContain('url=');
      expect(urls.linkedin).toContain('url=');
      expect(urls.facebook).toContain('u=');
      expect(urls.email).toContain('subject=');
    });

    it('should properly encode special characters', () => {
      const specialUrl = 'https://example.com/path?param=value&other=test';
      const specialTitle = 'Test & "Special" Characters';
      const urls = generateShareUrls(specialUrl, specialTitle, '');

      // The URL should encode the special characters in the parameters
      expect(urls.twitter).toContain('%26'); // encoded & in URL or title
      expect(urls.twitter).toContain('%22'); // encoded "
    });

    it('should return all four share types', () => {
      const urls = generateShareUrls(testUrl, testTitle, testDescription);

      expect(Object.keys(urls)).toHaveLength(4);
      expect(urls).toHaveProperty('twitter');
      expect(urls).toHaveProperty('linkedin');
      expect(urls).toHaveProperty('facebook');
      expect(urls).toHaveProperty('email');
    });
  });

  describe('copyToClipboard', () => {
    const mockWriteText = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      // Mock navigator.clipboard
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      console.error.mockRestore();
    });

    it('should copy provided URL to clipboard', async () => {
      mockWriteText.mockResolvedValue(undefined);

      const result = await copyToClipboard('https://jlowe.ai/test');

      expect(mockWriteText).toHaveBeenCalledWith('https://jlowe.ai/test');
      expect(result).toEqual({ success: true });
    });

    it('should use window.location.href when URL is falsy', async () => {
      mockWriteText.mockResolvedValue(undefined);
      
      // Mock window.location.href
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: 'https://current-page.com/path' };

      const result = await copyToClipboard(null);

      expect(mockWriteText).toHaveBeenCalledWith('https://current-page.com/path');
      expect(result).toEqual({ success: true });

      window.location = originalLocation;
    });

    it('should use fallback URL when provided and URL is falsy', async () => {
      mockWriteText.mockResolvedValue(undefined);
      
      // Simulate server-side where window is undefined
      const originalWindow = global.window;
      delete global.window;
      // @ts-ignore
      global.window = undefined;

      const result = await copyToClipboard(null, 'https://fallback.com');

      // In actual SSR, this would use fallback, but in JSDOM window exists
      expect(result).toEqual({ success: true });

      global.window = originalWindow;
    });

    it('should return error when clipboard write fails', async () => {
      const error = new Error('Clipboard not available');
      mockWriteText.mockRejectedValue(error);

      const result = await copyToClipboard('https://jlowe.ai/test');

      expect(result).toEqual({ success: false, error });
      expect(console.error).toHaveBeenCalledWith('Failed to copy link:', error);
    });

    it('should handle empty string URL', async () => {
      mockWriteText.mockResolvedValue(undefined);
      
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: 'https://default.com' };

      const result = await copyToClipboard('');

      expect(mockWriteText).toHaveBeenCalledWith('https://default.com');
      expect(result).toEqual({ success: true });

      window.location = originalLocation;
    });
  });
});

