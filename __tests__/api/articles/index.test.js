/**
 * Tests for /api/articles/index.js
 *
 * Tests for the public articles API endpoint
 */

import articlesHandler from "../../../pages/api/articles/index.js";
import prisma from "../../../lib/prisma.js";
import {
  createMockRequest,
  createMockResponse,
  getJsonResponse,
  getStatusCode,
} from "../../setup/api-test-utils.js";

// Mock Prisma client
jest.mock("../../../lib/prisma.js", () => ({
  __esModule: true,
  default: {
    post: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock next-auth/jwt
jest.mock("next-auth/jwt", () => ({
  getToken: jest.fn(),
}));

import { getToken } from "next-auth/jwt";

describe("Articles API (/api/articles)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/articles", () => {
    it("should return published articles by default", async () => {
      const mockPosts = [
        {
          id: "1",
          title: "Published Article",
          slug: "published-article",
          status: "Published",
          topic: "javascript",
          datePublished: new Date(),
        },
      ];

      prisma.post.findMany.mockResolvedValue(mockPosts);
      prisma.post.count.mockResolvedValue(1);

      const req = createMockRequest({ method: "GET" });
      const res = createMockResponse();

      await articlesHandler(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "Published",
          }),
        })
      );

      expect(getStatusCode(res)).toBe(200);
      const response = getJsonResponse(res);
      expect(response.posts).toEqual(mockPosts);
      expect(response.total).toBe(1);
    });

    it("should filter by topic", async () => {
      const mockPosts = [
        { id: "1", title: "React Article", topic: "react" },
      ];
      prisma.post.findMany.mockResolvedValue(mockPosts);
      prisma.post.count.mockResolvedValue(1);

      const req = createMockRequest({
        method: "GET",
        query: { topic: "react" },
      });
      const res = createMockResponse();

      await articlesHandler(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            topic: "react",
          }),
        })
      );
    });

    it("should search by query", async () => {
      const mockPosts = [{ id: "1", title: "JavaScript Tutorial" }];
      prisma.post.findMany.mockResolvedValue(mockPosts);
      prisma.post.count.mockResolvedValue(1);

      const req = createMockRequest({
        method: "GET",
        query: { search: "javascript" },
      });
      const res = createMockResponse();

      await articlesHandler(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                title: expect.objectContaining({
                  contains: "javascript",
                }),
              }),
            ]),
          }),
        })
      );
    });

    it("should support pagination", async () => {
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(0);

      const req = createMockRequest({
        method: "GET",
        query: { limit: "10", offset: "20" },
      });
      const res = createMockResponse();

      await articlesHandler(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    it("should support sorting", async () => {
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(0);

      const req = createMockRequest({
        method: "GET",
        query: { sortBy: "title", sortOrder: "asc" },
      });
      const res = createMockResponse();

      await articlesHandler(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.objectContaining({
            title: "asc",
          }),
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      prisma.post.findMany.mockRejectedValue(new Error("Database error"));

      const req = createMockRequest({ method: "GET" });
      const res = createMockResponse();

      await articlesHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe("POST /api/articles", () => {
    const validArticleData = {
      title: "New Article",
      description: "Article description",
      content: "# Article Content\n\nThis is the content.",
      postType: "Article",
      topic: "javascript",
      slug: "new-article",
      author: "Admin",
      status: "Draft",
      tags: ["javascript", "tutorial"],
    };

    describe("Authentication", () => {
      it("should return 401 if not authenticated", async () => {
        getToken.mockResolvedValue(null);

        const req = createMockRequest({
          method: "POST",
          body: validArticleData,
        });
        const res = createMockResponse();

        await articlesHandler(req, res);

        expect(getStatusCode(res)).toBe(401);
        const response = getJsonResponse(res);
        expect(response.message).toBe("Authentication required");
      });

      it("should allow authenticated users to create articles", async () => {
        getToken.mockResolvedValue({
          id: "1",
          email: "admin@example.com",
          role: "admin",
        });

        prisma.post.findUnique.mockResolvedValue(null);
        prisma.post.create.mockResolvedValue({
          id: "1",
          ...validArticleData,
        });

        const req = createMockRequest({
          method: "POST",
          body: validArticleData,
        });
        const res = createMockResponse();

        await articlesHandler(req, res);

        expect(getStatusCode(res)).toBe(201);
      });
    });

    describe("Validation", () => {
      beforeEach(() => {
        getToken.mockResolvedValue({
          id: "1",
          email: "admin@example.com",
          role: "admin",
        });
      });

      it("should return 400 if title is missing", async () => {
        const req = createMockRequest({
          method: "POST",
          body: {
            ...validArticleData,
            title: undefined,
          },
        });
        const res = createMockResponse();

        await articlesHandler(req, res);

        expect(getStatusCode(res)).toBe(400);
        const response = getJsonResponse(res);
        expect(response.message).toContain("title");
      });

      it("should return 400 if description is missing", async () => {
        const req = createMockRequest({
          method: "POST",
          body: {
            ...validArticleData,
            description: undefined,
          },
        });
        const res = createMockResponse();

        await articlesHandler(req, res);

        expect(getStatusCode(res)).toBe(400);
        const response = getJsonResponse(res);
        expect(response.message).toContain("description");
      });

      it("should return 400 if topic is missing", async () => {
        const req = createMockRequest({
          method: "POST",
          body: {
            ...validArticleData,
            topic: undefined,
          },
        });
        const res = createMockResponse();

        await articlesHandler(req, res);

        expect(getStatusCode(res)).toBe(400);
        const response = getJsonResponse(res);
        expect(response.message).toContain("topic");
      });
    });

    describe("Slug Generation", () => {
      beforeEach(() => {
        getToken.mockResolvedValue({
          id: "1",
          email: "admin@example.com",
          role: "admin",
        });
        prisma.post.findUnique.mockResolvedValue(null);
      });

      it("should use provided slug", async () => {
        prisma.post.create.mockResolvedValue({
          id: "1",
          ...validArticleData,
          slug: "custom-slug",
        });

        const req = createMockRequest({
          method: "POST",
          body: {
            ...validArticleData,
            slug: "custom-slug",
          },
        });
        const res = createMockResponse();

        await articlesHandler(req, res);

        expect(prisma.post.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              slug: "custom-slug",
            }),
          })
        );
      });

      it("should generate slug from title if not provided", async () => {
        prisma.post.create.mockResolvedValue({
          id: "1",
          ...validArticleData,
          slug: "new-article",
        });

        const req = createMockRequest({
          method: "POST",
          body: {
            ...validArticleData,
            slug: undefined,
          },
        });
        const res = createMockResponse();

        await articlesHandler(req, res);

        expect(prisma.post.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              slug: "new-article",
            }),
          })
        );
      });

      it("should handle duplicate slugs by appending timestamp", async () => {
        prisma.post.findUnique.mockResolvedValue({ id: "existing" });
        prisma.post.create.mockResolvedValue({
          id: "1",
          ...validArticleData,
        });

        const req = createMockRequest({
          method: "POST",
          body: validArticleData,
        });
        const res = createMockResponse();

        await articlesHandler(req, res);

        expect(prisma.post.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              slug: expect.stringMatching(/^new-article-\d+$/),
            }),
          })
        );
      });
    });

    describe("Article Creation", () => {
      beforeEach(() => {
        getToken.mockResolvedValue({
          id: "1",
          email: "admin@example.com",
          role: "admin",
        });
        prisma.post.findUnique.mockResolvedValue(null);
      });

      it("should create article with all provided fields", async () => {
        const fullArticleData = {
          ...validArticleData,
          coverImage: "https://example.com/image.jpg",
          metaTitle: "SEO Title",
          metaDescription: "SEO Description",
          ogImage: "https://example.com/og.jpg",
        };

        prisma.post.create.mockResolvedValue({
          id: "1",
          ...fullArticleData,
        });

        const req = createMockRequest({
          method: "POST",
          body: fullArticleData,
        });
        const res = createMockResponse();

        await articlesHandler(req, res);

        expect(prisma.post.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              title: fullArticleData.title,
              description: fullArticleData.description,
              content: fullArticleData.content,
              topic: "javascript",
              coverImage: fullArticleData.coverImage,
              metaTitle: fullArticleData.metaTitle,
              metaDescription: fullArticleData.metaDescription,
            }),
          })
        );

        expect(getStatusCode(res)).toBe(201);
      });

      it("should calculate reading time from content", async () => {
        prisma.post.create.mockResolvedValue({
          id: "1",
          ...validArticleData,
          readingTime: 1,
        });

        const req = createMockRequest({
          method: "POST",
          body: {
            ...validArticleData,
            content:
              "This is a test article with some content to calculate reading time.",
          },
        });
        const res = createMockResponse();

        await articlesHandler(req, res);

        expect(prisma.post.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              readingTime: expect.any(Number),
            }),
          })
        );
      });

      it("should set datePublished when status is Published", async () => {
        prisma.post.create.mockResolvedValue({
          id: "1",
          ...validArticleData,
          status: "Published",
          datePublished: new Date(),
        });

        const req = createMockRequest({
          method: "POST",
          body: {
            ...validArticleData,
            status: "Published",
          },
        });
        const res = createMockResponse();

        await articlesHandler(req, res);

        expect(prisma.post.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: "Published",
              datePublished: expect.any(Date),
            }),
          })
        );
      });

      it("should not set datePublished for draft articles", async () => {
        prisma.post.create.mockResolvedValue({
          id: "1",
          ...validArticleData,
          status: "Draft",
          datePublished: null,
        });

        const req = createMockRequest({
          method: "POST",
          body: {
            ...validArticleData,
            status: "Draft",
          },
        });
        const res = createMockResponse();

        await articlesHandler(req, res);

        expect(prisma.post.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: "Draft",
              datePublished: null,
            }),
          })
        );
      });

      it("should lowercase the topic", async () => {
        prisma.post.create.mockResolvedValue({
          id: "1",
          ...validArticleData,
          topic: "javascript",
        });

        const req = createMockRequest({
          method: "POST",
          body: {
            ...validArticleData,
            topic: "JavaScript",
          },
        });
        const res = createMockResponse();

        await articlesHandler(req, res);

        expect(prisma.post.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              topic: "javascript",
            }),
          })
        );
      });

      it("should use session email as author if not provided", async () => {
        prisma.post.create.mockResolvedValue({
          id: "1",
          ...validArticleData,
          author: "admin@example.com",
        });

        const req = createMockRequest({
          method: "POST",
          body: {
            ...validArticleData,
            author: undefined,
          },
        });
        const res = createMockResponse();

        await articlesHandler(req, res);

        expect(prisma.post.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              author: "admin@example.com",
            }),
          })
        );
      });

      it("should handle empty tags", async () => {
        prisma.post.create.mockResolvedValue({
          id: "1",
          ...validArticleData,
          tags: [],
        });

        const req = createMockRequest({
          method: "POST",
          body: {
            ...validArticleData,
            tags: undefined,
          },
        });
        const res = createMockResponse();

        await articlesHandler(req, res);

        expect(prisma.post.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              tags: [],
            }),
          })
        );
      });
    });

    describe("Error Handling", () => {
      beforeEach(() => {
        getToken.mockResolvedValue({
          id: "1",
          email: "admin@example.com",
          role: "admin",
        });
        prisma.post.findUnique.mockResolvedValue(null);
      });

      it("should handle unique constraint violation", async () => {
        const uniqueError = new Error("Unique constraint failed");
        uniqueError.code = "P2002";
        prisma.post.create.mockRejectedValue(uniqueError);

        const req = createMockRequest({
          method: "POST",
          body: validArticleData,
        });
        const res = createMockResponse();

        await articlesHandler(req, res);

        expect(getStatusCode(res)).toBe(400);
        const response = getJsonResponse(res);
        expect(response.message).toContain("slug already exists");
      });

      it("should handle database errors gracefully", async () => {
        prisma.post.create.mockRejectedValue(new Error("Database error"));

        const req = createMockRequest({
          method: "POST",
          body: validArticleData,
        });
        const res = createMockResponse();

        await articlesHandler(req, res);

        expect(getStatusCode(res)).toBe(500);
      });
    });
  });

  describe("Method Not Allowed", () => {
    it("should return 405 for unsupported methods", async () => {
      const methods = ["PUT", "DELETE", "PATCH"];

      for (const method of methods) {
        const req = createMockRequest({ method });
        const res = createMockResponse();

        await articlesHandler(req, res);

        expect(getStatusCode(res)).toBe(405);
        const response = getJsonResponse(res);
        expect(response.message).toBe("Method Not Allowed");
      }
    });
  });
});

