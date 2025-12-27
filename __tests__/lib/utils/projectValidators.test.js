/**
 * Tests for projectValidators utility functions
 */

import {
  validateProjectData,
  validateTeamMember,
  validateTeamMembers,
  validateAdminProjectData,
} from "@/lib/utils/projectValidators";

describe("projectValidators utilities", () => {
  describe("validateProjectData", () => {
    it("should return isValid true when required fields are present", () => {
      const data = { title: "Test Project", startDate: "2024-01-01" };
      const result = validateProjectData(data);

      expect(result.isValid).toBe(true);
    });

    it("should return isValid false when required fields are missing", () => {
      const data = { title: "Test Project" };
      const result = validateProjectData(data);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain("Missing required fields");
    });

    it("should accept custom required fields", () => {
      const data = { title: "Test", slug: "test" };
      const result = validateProjectData(data, ["title", "slug"]);

      expect(result.isValid).toBe(true);
    });
  });

  describe("validateTeamMember", () => {
    it("should return isValid true when name is present", () => {
      const member = { name: "John Doe", email: "john@example.com" };
      const result = validateTeamMember(member);

      expect(result.isValid).toBe(true);
    });

    it("should return isValid true when only name is present", () => {
      const member = { name: "John Doe" };
      const result = validateTeamMember(member);

      expect(result.isValid).toBe(true);
    });

    it("should return isValid false when name is missing", () => {
      const member = { email: "john@example.com" };
      const result = validateTeamMember(member);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain("Team member name is required");
    });
  });

  describe("validateTeamMembers", () => {
    it("should return isValid true when all members are valid", () => {
      const team = [
        { name: "John Doe", email: "john@example.com" },
        { name: "Jane Smith" },
      ];
      const result = validateTeamMembers(team);

      expect(result.isValid).toBe(true);
    });

    it("should return isValid false when team is not an array", () => {
      const team = "not an array";
      const result = validateTeamMembers(team);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain("Team must be an array");
    });

    it("should return isValid false when a member is invalid", () => {
      const team = [
        { name: "John Doe" },
        { email: "jane@example.com" }, // Missing name
      ];
      const result = validateTeamMembers(team);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain("Team member name is required");
    });

    it("should handle empty array", () => {
      const result = validateTeamMembers([]);

      expect(result.isValid).toBe(true);
    });
  });

  describe("validateAdminProjectData", () => {
    it("should return isValid true when title and slug are present", () => {
      const data = { title: "Test Project", slug: "test-project" };
      const result = validateAdminProjectData(data);

      expect(result.isValid).toBe(true);
    });

    it("should return isValid false when title or slug is missing", () => {
      const data = { title: "Test Project" };
      const result = validateAdminProjectData(data);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain("slug");
    });
  });
});
