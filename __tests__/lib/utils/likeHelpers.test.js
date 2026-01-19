/**
 * Tests for likeHelpers utility functions
 */

import { buildLikeApiUrl } from "@/lib/utils/likeHelpers";

describe("buildLikeApiUrl", () => {
  it("should build correct URL with topic and slug", () => {
    const result = buildLikeApiUrl("react", "my-article");
    expect(result).toBe("/api/posts/react/my-article/like");
  });

  it("should handle different topics", () => {
    expect(buildLikeApiUrl("javascript", "intro")).toBe("/api/posts/javascript/intro/like");
    expect(buildLikeApiUrl("nextjs", "getting-started")).toBe("/api/posts/nextjs/getting-started/like");
    expect(buildLikeApiUrl("typescript", "types-101")).toBe("/api/posts/typescript/types-101/like");
  });

  it("should handle slugs with hyphens", () => {
    const result = buildLikeApiUrl("react", "building-a-todo-app-with-hooks");
    expect(result).toBe("/api/posts/react/building-a-todo-app-with-hooks/like");
  });

  it("should handle slugs with numbers", () => {
    const result = buildLikeApiUrl("css", "flexbox-101");
    expect(result).toBe("/api/posts/css/flexbox-101/like");
  });

  it("should handle single-word topics and slugs", () => {
    const result = buildLikeApiUrl("ai", "intro");
    expect(result).toBe("/api/posts/ai/intro/like");
  });

  it("should always start with /api/posts", () => {
    const result = buildLikeApiUrl("any-topic", "any-slug");
    expect(result.startsWith("/api/posts")).toBe(true);
  });

  it("should always end with /like", () => {
    const result = buildLikeApiUrl("topic", "slug");
    expect(result.endsWith("/like")).toBe(true);
  });

  it("should return a string", () => {
    const result = buildLikeApiUrl("test", "test");
    expect(typeof result).toBe("string");
  });
});

