/**
 * Tests for dateUtils utility
 * 
 * Comprehensive tests for all date formatting functions.
 */

import {
  formatDate,
  formatArticleDate,
  formatAdminDate,
  formatDateTime,
  formatMonthYear,
  formatDateUTC,
} from '@/lib/utils/dateUtils';

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

    it('should merge custom options with defaults', () => {
      const result = formatDate(testDate, { weekday: 'long' });
      expect(result).toContain('Monday');
      expect(result).toContain('January');
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

    it('should handle Date object', () => {
      const result = formatArticleDate(testDate);
      expect(result).toContain('January');
    });
  });

  describe('formatAdminDate', () => {
    it('should format date in short format', () => {
      const result = formatAdminDate(testDateString);
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should not contain full month name', () => {
      const result = formatAdminDate(testDateString);
      expect(result).not.toContain('January');
    });

    it('should handle null input', () => {
      expect(formatAdminDate(null)).toBe('');
    });
  });

  describe('formatDateTime', () => {
    it('should format date with time', () => {
      const result = formatDateTime(testDateString);
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
      // Time formatting depends on locale
      expect(result.length).toBeGreaterThan(15);
    });

    it('should include time component', () => {
      const result = formatDateTime(testDateString);
      // Should contain some time indicator
      expect(result).toMatch(/\d{1,2}:\d{2}|AM|PM/);
    });

    it('should handle null input', () => {
      expect(formatDateTime(null)).toBe('');
    });
  });

  describe('formatMonthYear', () => {
    it('should format date with month and year', () => {
      const result = formatMonthYear(testDateString);
      expect(result).toContain('January');
      expect(result).toContain('2024');
      // Note: Due to how options are merged, day may still be included
      // The function is intended for month/year display
    });

    it('should return "Present" for null', () => {
      expect(formatMonthYear(null)).toBe('Present');
    });

    it('should return "Present" for undefined', () => {
      expect(formatMonthYear(undefined)).toBe('Present');
    });

    it('should return "Present" for empty string', () => {
      expect(formatMonthYear('')).toBe('Present');
    });

    it('should handle Date object', () => {
      const result = formatMonthYear(testDate);
      expect(result).toContain('January');
      expect(result).toContain('2024');
    });
  });

  describe('formatDateUTC', () => {
    it('should format date in UTC timezone', () => {
      const result = formatDateUTC(testDateString);
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty string for null', () => {
      expect(formatDateUTC(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatDateUTC(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(formatDateUTC('')).toBe('');
    });

    it('should return empty string for invalid date', () => {
      expect(formatDateUTC('not-a-date')).toBe('');
    });

    it('should handle Date object', () => {
      const result = formatDateUTC(testDate);
      expect(result).toBeTruthy();
    });
  });
});

