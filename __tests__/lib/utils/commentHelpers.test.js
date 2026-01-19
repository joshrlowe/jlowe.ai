/**
 * Tests for commentHelpers utility functions
 */

import { formatCommentDate } from "@/lib/utils/commentHelpers";

describe("formatCommentDate", () => {
  it("should format a valid date string", () => {
    const date = "2025-01-15T14:30:00.000Z";
    const result = formatCommentDate(date);
    
    // Should contain month, day, year, and time
    expect(result).toMatch(/January/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2025/);
  });

  it("should format ISO date strings correctly", () => {
    const date = "2024-06-20T09:15:00.000Z";
    const result = formatCommentDate(date);
    
    expect(result).toMatch(/June/);
    expect(result).toMatch(/20/);
    expect(result).toMatch(/2024/);
  });

  it("should include time in the output", () => {
    const date = "2025-03-10T15:45:00.000Z";
    const result = formatCommentDate(date);
    
    // Should contain a colon for time formatting (e.g., "3:45 PM")
    expect(result).toMatch(/:/);
  });

  it("should handle date objects converted to strings", () => {
    const date = new Date("2025-12-25T12:00:00.000Z").toISOString();
    const result = formatCommentDate(date);
    
    expect(result).toMatch(/December/);
    expect(result).toMatch(/25/);
    expect(result).toMatch(/2025/);
  });

  it("should handle different months correctly", () => {
    // Use mid-month noon times to avoid timezone edge cases
    const months = [
      { date: "2025-01-15T12:00:00.000Z", expected: "January" },
      { date: "2025-02-15T12:00:00.000Z", expected: "February" },
      { date: "2025-06-15T12:00:00.000Z", expected: "June" },
      { date: "2025-12-15T12:00:00.000Z", expected: "December" },
    ];

    months.forEach(({ date, expected }) => {
      const result = formatCommentDate(date);
      expect(result).toMatch(new RegExp(expected));
    });
  });

  it("should return a string", () => {
    const date = "2025-01-01T00:00:00.000Z";
    const result = formatCommentDate(date);
    
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

