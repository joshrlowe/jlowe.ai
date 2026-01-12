/**
 * Tests for queryBuilders utility functions
 */

import {
  buildPostWhereClause,
  buildProjectWhereClause,
  buildPostIncludeClause,
  buildProjectIncludeClause,
  buildPostQuery,
  buildProjectQuery,
} from "@/lib/utils/queryBuilders";

describe("queryBuilders utilities", () => {
  describe("buildPostWhereClause", () => {
    it("should build where clause with status filter", () => {
      const result = buildPostWhereClause({ status: "Published" });
      expect(result.status).toBe("Published");
    });

    it("should handle 'all' status", () => {
      const result = buildPostWhereClause({ status: "all" });
      expect(result.status).toBeUndefined();
    });

    it("should include topic filter", () => {
      const result = buildPostWhereClause({ topic: "React" });
      expect(result.topic).toBe("react");
    });

    it("should include search filter", () => {
      const result = buildPostWhereClause({ search: "test" });
      expect(result.OR).toBeDefined();
      expect(result.OR.length).toBeGreaterThan(0);
    });

    it("should include tags filter", () => {
      const result = buildPostWhereClause({ tags: ["javascript", "react"] });
      expect(result.tags).toBeDefined();
      expect(result.tags.hasSome).toEqual(["javascript", "react"]);
    });

    it("should handle single tag", () => {
      const result = buildPostWhereClause({ tags: "javascript" });
      expect(result.tags.hasSome).toEqual(["javascript"]);
    });

    it("should remove undefined values", () => {
      const result = buildPostWhereClause({});
      expect(result.status).toBeUndefined();
      expect(result.topic).toBeUndefined();
    });
  });

  describe("buildProjectWhereClause", () => {
    it("should build where clause with status filter", () => {
      const result = buildProjectWhereClause({ status: "Published" });
      expect(result.status).toBe("Published");
    });

    it("should handle 'all' status", () => {
      const result = buildProjectWhereClause({ status: "all" });
      expect(result.status).toBeUndefined();
    });

    it("should include search filter", () => {
      const result = buildProjectWhereClause({ search: "test" });
      expect(result.OR).toBeDefined();
    });

    it("should include featured filter", () => {
      const result = buildProjectWhereClause({ featured: true });
      expect(result.featured).toBe(true);
    });
  });

  describe("buildPostIncludeClause", () => {
    it("should return include clause with counts when includeCounts is true", () => {
      const result = buildPostIncludeClause(true);
      expect(result._count).toBeDefined();
      expect(result._count.select.comments).toBe(true);
      expect(result._count.select.likes).toBe(true);
    });

    it("should return empty object when includeCounts is false", () => {
      const result = buildPostIncludeClause(false);
      expect(result).toEqual({});
    });

    it("should default to including counts", () => {
      const result = buildPostIncludeClause();
      expect(result._count).toBeDefined();
    });
  });

  describe("buildProjectIncludeClause", () => {
    it("should return include clause with teamMembers when includeTeam is true", () => {
      const result = buildProjectIncludeClause(true);
      expect(result.teamMembers).toBe(true);
    });

    it("should return empty object when includeTeam is false", () => {
      const result = buildProjectIncludeClause(false);
      expect(result).toEqual({});
    });

    it("should default to including team", () => {
      const result = buildProjectIncludeClause();
      expect(result.teamMembers).toBe(true);
    });
  });

  describe("buildPostQuery", () => {
    it("should build complete query with all parameters", () => {
      const where = { status: "Published" };
      const orderBy = { createdAt: "desc" };
      const result = buildPostQuery({
        where,
        orderBy,
        limit: 10,
        offset: 5,
        includeCounts: true,
      });

      expect(result.where).toEqual(where);
      expect(result.orderBy).toEqual(orderBy);
      expect(result.take).toBe(10);
      expect(result.skip).toBe(5);
      expect(result.include._count).toBeDefined();
    });

    it("should not include skip when offset is 0", () => {
      const where = { status: "Published" };
      const orderBy = { createdAt: "desc" };
      const result = buildPostQuery({
        where,
        orderBy,
        limit: 10,
        offset: 0,
        includeCounts: true,
      });

      expect(result.skip).toBeUndefined();
    });

    it("should handle missing limit and offset", () => {
      const where = {};
      const orderBy = { createdAt: "desc" };
      const result = buildPostQuery({ where, orderBy });

      expect(result.take).toBeUndefined();
      expect(result.skip).toBeUndefined();
    });

    it("should handle includeCounts false", () => {
      const where = {};
      const orderBy = { createdAt: "desc" };
      const result = buildPostQuery({ where, orderBy, includeCounts: false });

      expect(result.include).toEqual({});
    });
  });

  describe("buildProjectQuery", () => {
    it("should build complete query with all parameters", () => {
      const where = { status: "Published" };
      const orderBy = { createdAt: "desc" };
      const result = buildProjectQuery({
        where,
        orderBy,
        limit: 10,
        offset: 5,
        includeTeam: true,
      });

      expect(result.where).toEqual(where);
      expect(result.orderBy).toEqual(orderBy);
      expect(result.take).toBe(10);
      expect(result.skip).toBe(5);
      expect(result.include.teamMembers).toBe(true);
    });

    it("should not include skip when offset is 0", () => {
      const where = { status: "Published" };
      const orderBy = { createdAt: "desc" };
      const result = buildProjectQuery({
        where,
        orderBy,
        limit: 10,
        offset: 0,
        includeTeam: true,
      });

      expect(result.skip).toBeUndefined();
    });

    it("should handle includeTeam false", () => {
      const where = {};
      const orderBy = { createdAt: "desc" };
      const result = buildProjectQuery({ where, orderBy, includeTeam: false });

      expect(result.include).toEqual({});
    });
  });
});
