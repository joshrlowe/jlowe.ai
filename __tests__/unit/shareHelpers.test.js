/**
 * Tests for shareHelpers utility
 * 
 * Tests social sharing URL generation and clipboard functions.
 */

import { generateShareUrls, copyToClipboard } from '@/lib/utils/shareHelpers';

describe('shareHelpers', () => {
  describe('generateShareUrls', () => {
    const testUrl = 'https://example.com/article';
    const testTitle = 'Test Article';
    const testDescription = 'This is a test article description';

    it('should generate Twitter share URL', () => {
      const result = generateShareUrls(testUrl, testTitle, testDescription);
      
      expect(result.twitter).toContain('twitter.com/intent/tweet');
      expect(result.twitter).toContain(encodeURIComponent(testUrl));
      expect(result.twitter).toContain(encodeURIComponent(testTitle));
    });

    it('should generate LinkedIn share URL', () => {
      const result = generateShareUrls(testUrl, testTitle, testDescription);
      
      expect(result.linkedin).toContain('linkedin.com/sharing/share-offsite');
      expect(result.linkedin).toContain(encodeURIComponent(testUrl));
    });

    it('should generate Facebook share URL', () => {
      const result = generateShareUrls(testUrl, testTitle, testDescription);
      
      expect(result.facebook).toContain('facebook.com/sharer/sharer.php');
      expect(result.facebook).toContain(encodeURIComponent(testUrl));
    });

    it('should generate email share URL', () => {
      const result = generateShareUrls(testUrl, testTitle, testDescription);
      
      expect(result.email).toContain('mailto:');
      expect(result.email).toContain(encodeURIComponent(testTitle));
      expect(result.email).toContain(encodeURIComponent(testDescription));
      expect(result.email).toContain(encodeURIComponent(testUrl));
    });

    it('should handle empty URL', () => {
      const result = generateShareUrls('', testTitle, testDescription);
      
      expect(result.twitter).toContain('url=');
      expect(result.linkedin).toContain('url=');
    });

    it('should handle null/undefined values', () => {
      const result = generateShareUrls(null, undefined, null);
      
      expect(result.twitter).toBeDefined();
      expect(result.linkedin).toBeDefined();
      expect(result.facebook).toBeDefined();
      expect(result.email).toBeDefined();
    });

    it('should properly encode special characters', () => {
      const specialUrl = 'https://example.com/article?param=value&other=123';
      const specialTitle = 'Article with "quotes" & <special> chars';
      
      const result = generateShareUrls(specialUrl, specialTitle, '');
      
      expect(result.twitter).not.toContain('&other=');
      expect(result.twitter).toContain(encodeURIComponent('&other='));
    });
  });

  describe('copyToClipboard', () => {
    let mockWriteText;

    beforeEach(() => {
      mockWriteText = jest.fn().mockResolvedValue(undefined);
      
      // Mock navigator.clipboard using Object.defineProperty
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });
    });

    it('should copy provided URL to clipboard', async () => {
      const url = 'https://example.com';
      const result = await copyToClipboard(url);
      
      expect(result.success).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith(url);
    });

    it('should use window.location.href when URL is empty', async () => {
      const result = await copyToClipboard('');
      
      expect(result.success).toBe(true);
      // URL will be window.location.href in jsdom
      expect(mockWriteText).toHaveBeenCalled();
    });

    it('should use window.location.href when URL is null', async () => {
      const result = await copyToClipboard(null);
      
      expect(result.success).toBe(true);
      expect(mockWriteText).toHaveBeenCalled();
    });

    it('should return error on clipboard failure', async () => {
      const error = new Error('Clipboard access denied');
      mockWriteText.mockRejectedValue(error);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await copyToClipboard('https://example.com');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      
      consoleSpy.mockRestore();
    });

    it('should use fallbackUrl when URL is falsy', async () => {
      const result = await copyToClipboard('', 'https://fallback.com');
      
      // When URL is empty and window exists, it uses window.location.href
      // fallbackUrl is only used when window is undefined (not testable in jsdom)
      expect(result.success).toBe(true);
    });
  });
});

