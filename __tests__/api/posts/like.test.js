/**
 * Tests for posts like API route
 */

import prisma from "@/__mocks__/prisma";
import likeHandler from "@/pages/api/posts/[topic]/[slug]/like";

jest.mock("@/lib/prisma", () => require("@/__mocks__/prisma"));
jest.mock("@/lib/utils/apiErrorHandler", () => ({
  handleApiError: jest.fn((error, res) => {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }),
}));

const createMockRequest = (method, query = {}, headers = {}) => ({
  method,
  query,
  headers: {
    "x-forwarded-for": "192.168.1.1",
    "user-agent": "Test Browser",
    ...headers,
  },
  connection: { remoteAddress: "127.0.0.1" },
  socket: { remoteAddress: "127.0.0.1" },
});

const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("POST /api/posts/[topic]/[slug]/like", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a like for a post", async () => {
    const mockPost = { id: "1", slug: "test-post", topic: "tech" };
    prisma.post.findUnique.mockResolvedValue(mockPost);
    prisma.like.findFirst.mockResolvedValue(null);
    prisma.like.create.mockResolvedValue({ id: "1", postId: "1" });
    prisma.like.count.mockResolvedValue(1);

    const req = createMockRequest("POST", { topic: "TECH", slug: "test-post" });
    const res = createMockResponse();

    await likeHandler(req, res);

    expect(prisma.post.findUnique).toHaveBeenCalledWith({
      where: { slug: "test-post", topic: "tech" },
    });
    expect(prisma.like.create).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ liked: true, likeCount: 1 });
  });

  it("returns 404 when post is not found", async () => {
    prisma.post.findUnique.mockResolvedValue(null);

    const req = createMockRequest("POST", { topic: "tech", slug: "nonexistent" });
    const res = createMockResponse();

    await likeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Post not found" });
  });

  it("returns 400 when post is already liked", async () => {
    const mockPost = { id: "1", slug: "test-post", topic: "tech" };
    prisma.post.findUnique.mockResolvedValue(mockPost);
    prisma.like.findFirst.mockResolvedValue({ id: "1" });

    const req = createMockRequest("POST", { topic: "tech", slug: "test-post" });
    const res = createMockResponse();

    await likeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Already liked" });
  });

  it("handles unique constraint violation", async () => {
    const mockPost = { id: "1", slug: "test-post", topic: "tech" };
    prisma.post.findUnique.mockResolvedValue(mockPost);
    prisma.like.findFirst.mockResolvedValue(null);
    prisma.like.create.mockRejectedValue({ code: "P2002" });

    const req = createMockRequest("POST", { topic: "tech", slug: "test-post" });
    const res = createMockResponse();

    await likeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Already liked" });
  });

  it("handles unique message error", async () => {
    const mockPost = { id: "1", slug: "test-post", topic: "tech" };
    prisma.post.findUnique.mockResolvedValue(mockPost);
    prisma.like.findFirst.mockResolvedValue(null);
    prisma.like.create.mockRejectedValue(new Error("unique constraint"));

    const req = createMockRequest("POST", { topic: "tech", slug: "test-post" });
    const res = createMockResponse();

    await likeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Already liked" });
  });

  it("uses connection.remoteAddress when x-forwarded-for is missing", async () => {
    const mockPost = { id: "1", slug: "test-post", topic: "tech" };
    prisma.post.findUnique.mockResolvedValue(mockPost);
    prisma.like.findFirst.mockResolvedValue(null);
    prisma.like.create.mockResolvedValue({ id: "1", postId: "1" });
    prisma.like.count.mockResolvedValue(1);

    const req = createMockRequest("POST", { topic: "tech", slug: "test-post" }, {});
    delete req.headers["x-forwarded-for"];
    const res = createMockResponse();

    await likeHandler(req, res);

    expect(prisma.like.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userIP: "127.0.0.1",
        }),
      }),
    );
  });
});

describe("GET /api/posts/[topic]/[slug]/like", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns like status for a post", async () => {
    const mockPost = { id: "1", slug: "test-post", topic: "tech" };
    prisma.post.findUnique.mockResolvedValue(mockPost);
    prisma.like.findFirst.mockResolvedValue({ id: "1" });
    prisma.like.count.mockResolvedValue(5);

    const req = createMockRequest("GET", { topic: "TECH", slug: "test-post" });
    const res = createMockResponse();

    await likeHandler(req, res);

    expect(res.json).toHaveBeenCalledWith({ liked: true, likeCount: 5 });
  });

  it("returns not liked when user has not liked", async () => {
    const mockPost = { id: "1", slug: "test-post", topic: "tech" };
    prisma.post.findUnique.mockResolvedValue(mockPost);
    prisma.like.findFirst.mockResolvedValue(null);
    prisma.like.count.mockResolvedValue(5);

    const req = createMockRequest("GET", { topic: "tech", slug: "test-post" });
    const res = createMockResponse();

    await likeHandler(req, res);

    expect(res.json).toHaveBeenCalledWith({ liked: false, likeCount: 5 });
  });

  it("returns 404 when post is not found", async () => {
    prisma.post.findUnique.mockResolvedValue(null);

    const req = createMockRequest("GET", { topic: "tech", slug: "nonexistent" });
    const res = createMockResponse();

    await likeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Post not found" });
  });

  it("extracts IP from x-forwarded-for header", async () => {
    const mockPost = { id: "1", slug: "test-post", topic: "tech" };
    prisma.post.findUnique.mockResolvedValue(mockPost);
    prisma.like.findFirst.mockResolvedValue(null);
    prisma.like.count.mockResolvedValue(0);

    const req = createMockRequest(
      "GET",
      { topic: "tech", slug: "test-post" },
      { "x-forwarded-for": "10.0.0.1, 192.168.1.1" },
    );
    const res = createMockResponse();

    await likeHandler(req, res);

    expect(prisma.like.findFirst).toHaveBeenCalledWith({
      where: { postId: "1", userIP: "10.0.0.1" },
    });
  });

  it("uses socket.remoteAddress as fallback", async () => {
    const mockPost = { id: "1", slug: "test-post", topic: "tech" };
    prisma.post.findUnique.mockResolvedValue(mockPost);
    prisma.like.findFirst.mockResolvedValue(null);
    prisma.like.count.mockResolvedValue(0);

    const req = {
      method: "GET",
      query: { topic: "tech", slug: "test-post" },
      headers: {},
      connection: {},
      socket: { remoteAddress: "10.0.0.2" },
    };
    const res = createMockResponse();

    await likeHandler(req, res);

    expect(prisma.like.findFirst).toHaveBeenCalledWith({
      where: { postId: "1", userIP: "10.0.0.2" },
    });
  });

  it("uses default IP when all methods fail", async () => {
    const mockPost = { id: "1", slug: "test-post", topic: "tech" };
    prisma.post.findUnique.mockResolvedValue(mockPost);
    prisma.like.findFirst.mockResolvedValue(null);
    prisma.like.count.mockResolvedValue(0);

    const req = {
      method: "GET",
      query: { topic: "tech", slug: "test-post" },
      headers: {},
      connection: {},
      socket: {},
    };
    const res = createMockResponse();

    await likeHandler(req, res);

    expect(prisma.like.findFirst).toHaveBeenCalledWith({
      where: { postId: "1", userIP: "0.0.0.0" },
    });
  });
});

describe("Unsupported methods", () => {
  it("returns 405 for unsupported methods", async () => {
    const req = createMockRequest("DELETE", { topic: "tech", slug: "test-post" });
    const res = createMockResponse();

    await likeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ message: "Method Not Allowed" });
  });

  it("returns 405 for PUT method", async () => {
    const req = createMockRequest("PUT", { topic: "tech", slug: "test-post" });
    const res = createMockResponse();

    await likeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });
});

