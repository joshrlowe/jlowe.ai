/**
 * Tests for lib/utils/queryBuilders.js
 */

import {
  buildPostWhereClause,
  buildProjectWhereClause,
  buildPostIncludeClause,
  buildProjectIncludeClause,
  buildPostQuery,
  buildProjectQuery,
} from "../../../lib/utils/queryBuilders";

describe("queryBuilders", () => {
  describe("buildPostWhereClause", () => {
    it("builds where clause with status", () => {
      const result = buildPostWhereClause({ status: "Published" });
      expect(result).toEqual({ status: "Published" });
    });

    it("excludes status when it is 'all'", () => {
      const result = buildPostWhereClause({ status: "all" });
      expect(result).toEqual({});
    });

    it("builds where clause with topic (lowercased)", () => {
      const result = buildPostWhereClause({ topic: "REACT" });
      expect(result).toEqual({ topic: "react" });
    });

    it("builds where clause with search", () => {
      const result = buildPostWhereClause({ search: "hooks" });
      expect(result.OR).toBeDefined();
      expect(result.OR.length).toBe(3); // title, description, content
    });

    it("builds where clause with single tag", () => {
      const result = buildPostWhereClause({ tags: "javascript" });
      expect(result.tags).toEqual({ hasSome: ["javascript"] });
    });

    it("builds where clause with multiple tags", () => {
      const result = buildPostWhereClause({ tags: ["javascript", "react"] });
      expect(result.tags).toEqual({ hasSome: ["javascript", "react"] });
    });

    it("builds where clause with all filters", () => {
      const result = buildPostWhereClause({
        status: "Published",
        topic: "tech",
        search: "hooks",
        tags: ["react"],
      });
      expect(result.status).toBe("Published");
      expect(result.topic).toBe("tech");
      expect(result.OR).toBeDefined();
      expect(result.tags).toBeDefined();
    });

    it("returns empty object when no filters", () => {
      const result = buildPostWhereClause({});
      expect(result).toEqual({});
    });
  });

  describe("buildProjectWhereClause", () => {
    it("builds where clause with status", () => {
      const result = buildProjectWhereClause({ status: "Completed" });
      expect(result).toEqual({ status: "Completed" });
    });

    it("excludes status when it is 'all'", () => {
      const result = buildProjectWhereClause({ status: "all" });
      expect(result).toEqual({});
    });

    it("builds where clause with search", () => {
      const result = buildProjectWhereClause({ search: "ai" });
      expect(result.OR).toBeDefined();
      expect(result.OR.length).toBe(3); // title, description, shortDescription
    });

    it("builds where clause with tags", () => {
      const result = buildProjectWhereClause({ tags: ["ai", "ml"] });
      expect(result.tags).toEqual({ hasSome: ["ai", "ml"] });
    });

    it("builds where clause with featured true", () => {
      const result = buildProjectWhereClause({ featured: true });
      expect(result.featured).toBe(true);
    });

    it("builds where clause with featured false", () => {
      const result = buildProjectWhereClause({ featured: false });
      expect(result.featured).toBe(false);
    });

    it("does not include featured when undefined", () => {
      const result = buildProjectWhereClause({});
      expect(result.featured).toBeUndefined();
    });
  });

  describe("buildPostIncludeClause", () => {
    it("includes counts by default", () => {
      const result = buildPostIncludeClause();
      expect(result._count).toBeDefined();
      expect(result._count.select.comments).toBe(true);
      expect(result._count.select.likes).toBe(true);
    });

    it("includes counts when true", () => {
      const result = buildPostIncludeClause(true);
      expect(result._count).toBeDefined();
    });

    it("returns empty object when false", () => {
      const result = buildPostIncludeClause(false);
      expect(result).toEqual({});
    });
  });

  describe("buildProjectIncludeClause", () => {
    it("includes team members by default", () => {
      const result = buildProjectIncludeClause();
      expect(result.teamMembers).toBe(true);
    });

    it("includes team members when true", () => {
      const result = buildProjectIncludeClause(true);
      expect(result.teamMembers).toBe(true);
    });

    it("returns empty object when false", () => {
      const result = buildProjectIncludeClause(false);
      expect(result).toEqual({});
    });
  });

  describe("buildPostQuery", () => {
    it("builds complete query", () => {
      const result = buildPostQuery({
        where: { status: "Published" },
        orderBy: { createdAt: "desc" },
        limit: 10,
        offset: 20,
      });

      expect(result.where).toEqual({ status: "Published" });
      expect(result.orderBy).toEqual({ createdAt: "desc" });
      expect(result.take).toBe(10);
      expect(result.skip).toBe(20);
      expect(result.include._count).toBeDefined();
    });

    it("excludes take when limit is undefined", () => {
      const result = buildPostQuery({
        where: {},
        orderBy: {},
      });
      expect(result.take).toBeUndefined();
    });

    it("excludes skip when offset is undefined", () => {
      const result = buildPostQuery({
        where: {},
        orderBy: {},
      });
      expect(result.skip).toBeUndefined();
    });

    it("excludes skip when offset is 0", () => {
      const result = buildPostQuery({
        where: {},
        orderBy: {},
        offset: 0,
      });
      expect(result.skip).toBeUndefined();
    });

    it("respects includeCounts parameter", () => {
      const result = buildPostQuery({
        where: {},
        orderBy: {},
        includeCounts: false,
      });
      expect(result.include).toEqual({});
    });
  });

  describe("buildProjectQuery", () => {
    it("builds complete query", () => {
      const result = buildProjectQuery({
        where: { status: "Completed" },
        orderBy: { updatedAt: "desc" },
        limit: 5,
        offset: 10,
      });

      expect(result.where).toEqual({ status: "Completed" });
      expect(result.orderBy).toEqual({ updatedAt: "desc" });
      expect(result.take).toBe(5);
      expect(result.skip).toBe(10);
      expect(result.include.teamMembers).toBe(true);
    });

    it("excludes take when limit is undefined", () => {
      const result = buildProjectQuery({
        where: {},
        orderBy: {},
      });
      expect(result.take).toBeUndefined();
    });

    it("respects includeTeam parameter", () => {
      const result = buildProjectQuery({
        where: {},
        orderBy: {},
        includeTeam: false,
      });
      expect(result.include).toEqual({});
    });
  });
});
