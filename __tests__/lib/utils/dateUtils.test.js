/**
 * Tests for lib/utils/dateUtils.js
 */

import {
  formatDate,
  formatArticleDate,
  formatAdminDate,
  formatDateTime,
  formatMonthYear,
  formatDateUTC,
} from "../../../lib/utils/dateUtils";

describe("dateUtils", () => {
  describe("formatDate", () => {
    it("formats ISO date string", () => {
      const result = formatDate("2024-01-15T12:00:00");
      expect(result).toContain("January");
      expect(result).toContain("2024");
    });

    it("formats Date object", () => {
      const date = new Date(2024, 2, 20); // March 20, 2024 (month is 0-indexed)
      const result = formatDate(date);
      expect(result).toBe("March 20, 2024");
    });

    it("returns empty string for null", () => {
      expect(formatDate(null)).toBe("");
    });

    it("returns empty string for undefined", () => {
      expect(formatDate(undefined)).toBe("");
    });

    it("returns empty string for empty string", () => {
      expect(formatDate("")).toBe("");
    });

    it("returns empty string for invalid date", () => {
      expect(formatDate("not a date")).toBe("");
    });

    it("accepts custom options", () => {
      const result = formatDate("2024-01-15T12:00:00Z", { month: "short" });
      // Result should contain Jan and 2024
      expect(result).toContain("Jan");
      expect(result).toContain("2024");
    });

    it("merges custom options with defaults", () => {
      const result = formatDate("2024-01-15", { weekday: "long" });
      expect(result).toContain("January");
      expect(result).toContain("2024");
    });
  });

  describe("formatArticleDate", () => {
    it("formats date in long format", () => {
      const result = formatArticleDate("2024-01-15T12:00:00");
      expect(result).toContain("January");
      expect(result).toContain("2024");
    });

    it("returns empty string for null", () => {
      expect(formatArticleDate(null)).toBe("");
    });
  });

  describe("formatAdminDate", () => {
    it("formats date in short format", () => {
      const result = formatAdminDate("2024-01-15T12:00:00");
      expect(result).toContain("Jan");
      expect(result).toContain("2024");
    });

    it("returns empty string for null", () => {
      expect(formatAdminDate(null)).toBe("");
    });
  });

  describe("formatDateTime", () => {
    it("formats date with time", () => {
      const result = formatDateTime("2024-01-15T14:30:00");
      expect(result).toContain("January");
      expect(result).toContain("15");
      expect(result).toContain("2024");
      // Time format varies by locale/timezone
    });

    it("returns empty string for null", () => {
      expect(formatDateTime(null)).toBe("");
    });
  });

  describe("formatMonthYear", () => {
    it("formats date as month and year", () => {
      const result = formatMonthYear("2024-01-15T12:00:00");
      expect(result).toContain("January");
      expect(result).toContain("2024");
    });

    it("returns Present for null", () => {
      expect(formatMonthYear(null)).toBe("Present");
    });

    it("returns Present for undefined", () => {
      expect(formatMonthYear(undefined)).toBe("Present");
    });

    it("returns Present for empty string", () => {
      expect(formatMonthYear("")).toBe("Present");
    });
  });

  describe("formatDateUTC", () => {
    it("formats date in UTC", () => {
      const result = formatDateUTC("2024-01-15");
      // Result depends on UTC interpretation
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it("returns empty string for null", () => {
      expect(formatDateUTC(null)).toBe("");
    });

    it("returns empty string for empty string", () => {
      expect(formatDateUTC("")).toBe("");
    });

    it("returns empty string for invalid date", () => {
      expect(formatDateUTC("invalid")).toBe("");
    });

    it("handles Date object", () => {
      const date = new Date("2024-01-15T00:00:00Z");
      const result = formatDateUTC(date);
      expect(result).toBeTruthy();
    });
  });
});
