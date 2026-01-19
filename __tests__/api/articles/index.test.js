/**
 * Tests for articles API route
 */

import prisma from "@/__mocks__/prisma";
import handler from "@/pages/api/articles/index";

jest.mock("@/lib/prisma", () => require("@/__mocks__/prisma"));
jest.mock("next-auth/jwt", () => ({
  getToken: jest.fn(),
}));
jest.mock("@/lib/utils/apiErrorHandler", () => ({
  handleApiError: jest.fn((error, res) => {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }),
}));
jest.mock("@/lib/utils/apiHelpers", () => ({
  parsePagination: jest.fn(() => ({ limit: 10, offset: 0 })),
  parseSort: jest.fn(() => ({ sortBy: "datePublished", sortOrder: "desc" })),
  buildOrderBy: jest.fn(() => ({ datePublished: "desc" })),
  formatPaginatedResponse: jest.fn((data, total, limit, offset) => ({
    data,
    pagination: { total, limit, offset },
  })),
}));
jest.mock("@/lib/utils/queryBuilders", () => ({
  buildPostWhereClause: jest.fn(() => ({ status: "Published" })),
  buildPostQuery: jest.fn(() => ({
    where: { status: "Published" },
    orderBy: { datePublished: "desc" },
    take: 10,
    skip: 0,
  })),
}));
jest.mock("@/lib/utils/validators", () => ({
  validateRequiredFields: jest.fn(() => ({ isValid: true })),
}));
jest.mock("@/lib/utils/readingTime", () => ({
  calculateReadingTime: jest.fn(() => 5),
}));

import { getToken } from "next-auth/jwt";

const createMockRequest = (method, query = {}, body = {}) => ({
  method,
  query,
  body,
});

const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("GET /api/articles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns published articles", async () => {
    const mockPosts = [
      { id: "1", title: "Article 1", status: "Published" },
      { id: "2", title: "Article 2", status: "Published" },
    ];
    prisma.post.findMany.mockResolvedValue(mockPosts);
    prisma.post.count.mockResolvedValue(2);

    const req = createMockRequest("GET");
    const res = createMockResponse();

    await handler(req, res);

    expect(res.json).toHaveBeenCalled();
    const response = res.json.mock.calls[0][0];
    expect(response.data).toEqual(mockPosts);
  });

  it("returns empty array when no articles", async () => {
    prisma.post.findMany.mockResolvedValue([]);
    prisma.post.count.mockResolvedValue(0);

    const req = createMockRequest("GET");
    const res = createMockResponse();

    await handler(req, res);

    expect(res.json).toHaveBeenCalled();
    const response = res.json.mock.calls[0][0];
    expect(response.data).toEqual([]);
  });

  it("handles pagination parameters", async () => {
    prisma.post.findMany.mockResolvedValue([]);
    prisma.post.count.mockResolvedValue(0);

    const req = createMockRequest("GET", { page: "2", limit: "5" });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  it("handles database errors", async () => {
    const { handleApiError } = require("@/lib/utils/apiErrorHandler");
    prisma.post.findMany.mockRejectedValue(new Error("Database error"));

    const req = createMockRequest("GET");
    const res = createMockResponse();

    await handler(req, res);

    expect(handleApiError).toHaveBeenCalled();
  });
});

describe("POST /api/articles", () => {
  const { validateRequiredFields } = require("@/lib/utils/validators");

  beforeEach(() => {
    jest.clearAllMocks();
    getToken.mockResolvedValue({ email: "admin@example.com" });
    validateRequiredFields.mockReturnValue({ isValid: true });
  });

  it("returns 401 when not authenticated", async () => {
    getToken.mockResolvedValue(null);

    const req = createMockRequest("POST", {}, { title: "Test" });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Authentication required" });
  });

  it("creates a new article", async () => {
    const mockPost = {
      id: "1",
      title: "New Article",
      slug: "new-article",
    };
    prisma.post.findUnique.mockResolvedValue(null);
    prisma.post.create.mockResolvedValue(mockPost);

    const req = createMockRequest(
      "POST",
      {},
      {
        title: "New Article",
        description: "Test description",
        topic: "tech",
      },
    );
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(prisma.post.create).toHaveBeenCalled();
  });

  it("returns 400 for invalid data", async () => {
    validateRequiredFields.mockReturnValue({
      isValid: false,
      message: "Title is required",
    });

    const req = createMockRequest("POST", {}, {});
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Title is required" });
  });

  it("generates slug from title", async () => {
    prisma.post.findUnique.mockResolvedValue(null);
    prisma.post.create.mockResolvedValue({ id: "1", slug: "test-article" });

    const req = createMockRequest(
      "POST",
      {},
      {
        title: "Test Article",
        description: "Description",
        topic: "tech",
      },
    );
    const res = createMockResponse();

    await handler(req, res);

    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: expect.any(String),
        }),
      }),
    );
  });

  it("makes slug unique if already exists", async () => {
    prisma.post.findUnique.mockResolvedValue({ id: "existing" });
    prisma.post.create.mockResolvedValue({ id: "1", slug: "test-article-12345" });

    const req = createMockRequest(
      "POST",
      {},
      {
        title: "Test Article",
        description: "Description",
        topic: "tech",
        slug: "test-article",
      },
    );
    const res = createMockResponse();

    await handler(req, res);

    expect(prisma.post.create).toHaveBeenCalled();
    const createCall = prisma.post.create.mock.calls[0][0];
    expect(createCall.data.slug).toMatch(/test-article-\d+/);
  });

  it("handles unique constraint error", async () => {
    prisma.post.findUnique.mockResolvedValue(null);
    prisma.post.create.mockRejectedValue({ code: "P2002" });

    const req = createMockRequest(
      "POST",
      {},
      {
        title: "Test",
        description: "Desc",
        topic: "tech",
      },
    );
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "An article with this slug already exists",
    });
  });
});

describe("Unsupported methods", () => {
  it("returns 405 for unsupported methods", async () => {
    const req = createMockRequest("PUT");
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ message: "Method Not Allowed" });
  });
});
