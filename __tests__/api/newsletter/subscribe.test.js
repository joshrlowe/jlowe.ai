/**
 * Tests for newsletter subscribe API route
 */

import prisma from "@/__mocks__/prisma";
import handler from "@/pages/api/newsletter/subscribe";

jest.mock("@/lib/prisma", () => require("@/__mocks__/prisma"));
jest.mock("@/lib/utils/apiErrorHandler", () => ({
  handleApiError: jest.fn((error, res) => {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }),
}));

const createMockRequest = (method, body = {}) => ({
  method,
  body,
});

const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("POST /api/newsletter/subscribe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 405 for non-POST requests", async () => {
    const req = createMockRequest("GET");
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ message: "Method Not Allowed" });
  });

  it("returns 400 when email is missing", async () => {
    const req = createMockRequest("POST", {});
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Valid email is required" });
  });

  it("returns 400 when email is invalid", async () => {
    const req = createMockRequest("POST", { email: "invalidemail" });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Valid email is required" });
  });

  it("creates new subscription for new email", async () => {
    prisma.newsletterSubscription.findUnique.mockResolvedValue(null);
    prisma.newsletterSubscription.create.mockResolvedValue({
      id: "1",
      email: "test@example.com",
      active: true,
    });

    const req = createMockRequest("POST", { email: "test@example.com" });
    const res = createMockResponse();

    await handler(req, res);

    expect(prisma.newsletterSubscription.create).toHaveBeenCalledWith({
      data: {
        email: "test@example.com",
        active: true,
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Successfully subscribed",
      }),
    );
  });

  it("lowercases email before saving", async () => {
    prisma.newsletterSubscription.findUnique.mockResolvedValue(null);
    prisma.newsletterSubscription.create.mockResolvedValue({
      id: "1",
      email: "test@example.com",
      active: true,
    });

    const req = createMockRequest("POST", { email: "TEST@EXAMPLE.COM" });
    const res = createMockResponse();

    await handler(req, res);

    expect(prisma.newsletterSubscription.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(prisma.newsletterSubscription.create).toHaveBeenCalledWith({
      data: {
        email: "test@example.com",
        active: true,
      },
    });
  });

  it("returns 400 when email already subscribed and active", async () => {
    prisma.newsletterSubscription.findUnique.mockResolvedValue({
      id: "1",
      email: "test@example.com",
      active: true,
    });

    const req = createMockRequest("POST", { email: "test@example.com" });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Email already subscribed" });
  });

  it("reactivates subscription when email exists but inactive", async () => {
    prisma.newsletterSubscription.findUnique.mockResolvedValue({
      id: "1",
      email: "test@example.com",
      active: false,
    });
    prisma.newsletterSubscription.update.mockResolvedValue({
      id: "1",
      email: "test@example.com",
      active: true,
    });

    const req = createMockRequest("POST", { email: "test@example.com" });
    const res = createMockResponse();

    await handler(req, res);

    expect(prisma.newsletterSubscription.update).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
      data: { active: true },
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Subscription reactivated",
      }),
    );
  });

  it("handles database errors", async () => {
    const { handleApiError } = require("@/lib/utils/apiErrorHandler");
    prisma.newsletterSubscription.findUnique.mockRejectedValue(
      new Error("Database error"),
    );

    const req = createMockRequest("POST", { email: "test@example.com" });
    const res = createMockResponse();

    await handler(req, res);

    expect(handleApiError).toHaveBeenCalled();
  });
});
