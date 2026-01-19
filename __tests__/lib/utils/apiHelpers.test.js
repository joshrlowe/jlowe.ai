/**
 * Tests for lib/utils/apiHelpers.js
 */

import {
  parsePagination,
  parseSort,
  buildOrderBy,
  buildSearchFilter,
  removeUndefined,
  formatPaginatedResponse,
} from "../../../lib/utils/apiHelpers";

describe("apiHelpers", () => {
  describe("parsePagination", () => {
    it("returns parsed limit and offset", () => {
      const query = { limit: "20", offset: "10" };
      const result = parsePagination(query);
      expect(result).toEqual({ limit: 20, offset: 10 });
    });

    it("returns undefined limit when not provided", () => {
      const query = { offset: "10" };
      const result = parsePagination(query);
      expect(result).toEqual({ limit: undefined, offset: 10 });
    });

    it("returns 0 offset when not provided", () => {
      const query = { limit: "10" };
      const result = parsePagination(query);
      expect(result).toEqual({ limit: 10, offset: 0 });
    });

    it("handles empty query", () => {
      const result = parsePagination({});
      expect(result).toEqual({ limit: undefined, offset: 0 });
    });
  });

  describe("parseSort", () => {
    it("returns parsed sort parameters", () => {
      const query = { sortBy: "title", sortOrder: "asc" };
      const result = parseSort(query);
      expect(result).toEqual({ sortBy: "title", sortOrder: "asc" });
    });

    it("uses default sortBy when not provided", () => {
      const query = { sortOrder: "asc" };
      const result = parseSort(query, "createdAt");
      expect(result).toEqual({ sortBy: "createdAt", sortOrder: "asc" });
    });

    it("uses default sortOrder when not provided", () => {
      const query = { sortBy: "title" };
      const result = parseSort(query, "createdAt", "desc");
      expect(result).toEqual({ sortBy: "title", sortOrder: "desc" });
    });

    it("uses all defaults when query is empty", () => {
      const result = parseSort({}, "updatedAt", "asc");
      expect(result).toEqual({ sortBy: "updatedAt", sortOrder: "asc" });
    });
  });

  describe("buildOrderBy", () => {
    it("builds orderBy object", () => {
      const result = buildOrderBy("title", "asc");
      expect(result).toEqual({ title: "asc" });
    });

    it("uses fieldMap when provided", () => {
      const fieldMap = { date: "createdAt" };
      const result = buildOrderBy("date", "desc", fieldMap);
      expect(result).toEqual({ createdAt: "desc" });
    });

    it("uses sortBy directly when not in fieldMap", () => {
      const fieldMap = { date: "createdAt" };
      const result = buildOrderBy("title", "asc", fieldMap);
      expect(result).toEqual({ title: "asc" });
    });
  });

  describe("buildSearchFilter", () => {
    it("returns empty object when no search", () => {
      const result = buildSearchFilter("");
      expect(result).toEqual({});
    });

    it("returns empty object when search is null", () => {
      const result = buildSearchFilter(null);
      expect(result).toEqual({});
    });

    it("builds OR filter for default fields", () => {
      const result = buildSearchFilter("test");
      expect(result.OR).toHaveLength(2);
      expect(result.OR[0]).toEqual({
        title: { contains: "test", mode: "insensitive" },
      });
      expect(result.OR[1]).toEqual({
        description: { contains: "test", mode: "insensitive" },
      });
    });

    it("builds OR filter for custom fields", () => {
      const result = buildSearchFilter("test", ["name", "content"]);
      expect(result.OR).toHaveLength(2);
      expect(result.OR[0]).toEqual({
        name: { contains: "test", mode: "insensitive" },
      });
    });
  });

  describe("removeUndefined", () => {
    it("removes undefined values", () => {
      const obj = { a: 1, b: undefined, c: "test" };
      const result = removeUndefined(obj);
      expect(result).toEqual({ a: 1, c: "test" });
    });

    it("keeps null values", () => {
      const obj = { a: 1, b: null };
      const result = removeUndefined(obj);
      expect(result).toEqual({ a: 1, b: null });
    });

    it("returns empty object for all undefined", () => {
      const obj = { a: undefined, b: undefined };
      const result = removeUndefined(obj);
      expect(result).toEqual({});
    });

    it("does not modify original object", () => {
      const obj = { a: 1, b: undefined };
      removeUndefined(obj);
      expect(obj).toEqual({ a: 1, b: undefined });
    });
  });

  describe("formatPaginatedResponse", () => {
    it("formats response with auto-detected key", () => {
      const data = [{ id: 1, title: "Post 1" }];
      const result = formatPaginatedResponse(data, 100, 10, 0);
      expect(result).toEqual({
        posts: data,
        total: 100,
        limit: 10,
        offset: 0,
      });
    });

    it("uses items key for empty array", () => {
      const result = formatPaginatedResponse([], 0, 10, 0);
      expect(result).toEqual({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
      });
    });

    it("uses playlists key when data has playlistPosts", () => {
      const data = [{ id: 1, playlistPosts: [] }];
      const result = formatPaginatedResponse(data, 1, 10, 0);
      expect(result).toEqual({
        playlists: data,
        total: 1,
        limit: 10,
        offset: 0,
      });
    });

    it("uses custom dataKey when provided", () => {
      const data = [{ id: 1 }];
      const result = formatPaginatedResponse(data, 1, 10, 0, "articles");
      expect(result).toEqual({
        articles: data,
        total: 1,
        limit: 10,
        offset: 0,
      });
    });

    it("uses data length as limit when limit is undefined", () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = formatPaginatedResponse(data, 2, undefined, 0);
      expect(result.limit).toBe(2);
    });
  });
});

