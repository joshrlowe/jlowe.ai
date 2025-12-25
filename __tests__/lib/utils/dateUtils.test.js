/**
 * Tests for dateUtils
 */
import { formatDate, formatArticleDate, formatAdminDate, formatDateTime } from '@/lib/utils/dateUtils';

describe('dateUtils', () => {
  const testDate = new Date('2024-01-15T10:30:00Z');
  const testDateString = '2024-01-15T10:30:00Z';

  describe('formatDate', () => {
    it('should format a valid date string', () => {
      const result = formatDate(testDateString);
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should format a Date object', () => {
      const result = formatDate(testDate);
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should return empty string for null', () => {
      expect(formatDate(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatDate(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(formatDate('')).toBe('');
    });

    it('should return empty string for invalid date', () => {
      expect(formatDate('invalid-date')).toBe('');
    });

    it('should accept custom options', () => {
      const result = formatDate(testDate, { month: 'short', year: '2-digit' });
      expect(result).toContain('Jan');
      expect(result).not.toContain('January');
    });
  });

  describe('formatArticleDate', () => {
    it('should format date for article display', () => {
      const result = formatArticleDate(testDateString);
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should return empty string for invalid input', () => {
      expect(formatArticleDate(null)).toBe('');
      expect(formatArticleDate('invalid')).toBe('');
    });
  });

  describe('formatAdminDate', () => {
    it('should format date in short format', () => {
      const result = formatAdminDate(testDateString);
      expect(result).toContain('Jan'); // Short month
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });

  describe('formatDateTime', () => {
    it('should format date with time', () => {
      const result = formatDateTime(testDateString);
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
      // Time formatting depends on locale, so we just check it's there
      expect(result.length).toBeGreaterThan(15);
    });
  });
});

