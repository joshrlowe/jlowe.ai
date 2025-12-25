/**
 * Tests for validators utility functions
 */

import {
  validateRequiredFields,
  validateArrayField,
  validateArrayFields,
  combineValidations,
} from "@/lib/utils/validators";

describe("validators utilities", () => {
  describe("validateRequiredFields", () => {
    it("should return isValid true when all required fields are present", () => {
      const data = { name: "John", email: "john@example.com", age: 30 };
      const result = validateRequiredFields(data, ["name", "email"]);

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it("should return isValid false when required fields are missing", () => {
      const data = { name: "John" };
      const result = validateRequiredFields(data, ["name", "email", "age"]);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain("Missing required fields");
      expect(result.message).toContain("email");
      expect(result.message).toContain("age");
    });

    it("should handle empty object", () => {
      const data = {};
      const result = validateRequiredFields(data, ["name"]);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain("name");
    });

    it("should handle empty required fields array", () => {
      const data = { name: "John" };
      const result = validateRequiredFields(data, []);

      expect(result.isValid).toBe(true);
    });

    it("should treat falsy values (except 0 and false) as missing", () => {
      const data = { name: "", email: null, age: undefined };
      const result = validateRequiredFields(data, ["name", "email", "age"]);

      expect(result.isValid).toBe(false);
    });
  });

  describe("validateArrayField", () => {
    it("should return isValid true when value is an array", () => {
      const result = validateArrayField([1, 2, 3], "items");

      expect(result.isValid).toBe(true);
    });

    it("should return isValid false when value is not an array", () => {
      const result = validateArrayField("not an array", "items");

      expect(result.isValid).toBe(false);
      expect(result.message).toContain("items");
      expect(result.message).toContain("array");
    });

    it("should handle empty array", () => {
      const result = validateArrayField([], "items");

      expect(result.isValid).toBe(true);
    });
  });

  describe("validateArrayFields", () => {
    it("should return isValid true when all fields are arrays", () => {
      const data = { tags: [], skills: ["JS"], hobbies: ["reading"] };
      const result = validateArrayFields(data, ["tags", "skills", "hobbies"]);

      expect(result.isValid).toBe(true);
    });

    it("should return isValid false when any field is not an array", () => {
      const data = { tags: ["tag1"], skills: "not an array" };
      const result = validateArrayFields(data, ["tags", "skills"]);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain("skills");
    });

    it("should handle empty array fields list", () => {
      const data = { tags: [] };
      const result = validateArrayFields(data, []);

      expect(result.isValid).toBe(true);
    });
  });

  describe("combineValidations", () => {
    it("should return isValid true when all validations pass", () => {
      const result = combineValidations(
        { isValid: true },
        { isValid: true },
        { isValid: true }
      );

      expect(result.isValid).toBe(true);
    });

    it("should return isValid false on first failing validation", () => {
      const result = combineValidations(
        { isValid: true },
        { isValid: false, message: "Second validation failed" },
        { isValid: false, message: "Third validation failed" }
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toBe("Second validation failed");
    });

    it("should handle empty validations array", () => {
      const result = combineValidations();

      expect(result.isValid).toBe(true);
    });

    it("should handle single validation", () => {
      const result = combineValidations({ isValid: false, message: "Failed" });

      expect(result.isValid).toBe(false);
      expect(result.message).toBe("Failed");
    });
  });
});

