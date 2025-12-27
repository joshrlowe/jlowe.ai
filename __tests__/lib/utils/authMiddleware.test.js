/**
 * Tests for authMiddleware utility functions
 */

import { withAuth, getUserIdFromToken } from "@/lib/utils/authMiddleware";
import { getToken } from "next-auth/jwt";

jest.mock("next-auth/jwt");

describe("authMiddleware utilities", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      method: "GET",
      body: {},
      query: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("withAuth", () => {
    it("should call handler when token is valid", async () => {
      const mockToken = { email: "test@example.com" };
      getToken.mockResolvedValue(mockToken);

      const handler = jest.fn().mockResolvedValue(undefined);
      const wrappedHandler = withAuth(handler);

      await wrappedHandler(mockReq, mockRes);

      expect(handler).toHaveBeenCalledWith(mockReq, mockRes, mockToken);
      expect(mockRes.status).not.toHaveBeenCalledWith(401);
    });

    it("should return 401 when token is missing", async () => {
      getToken.mockResolvedValue(null);

      const handler = jest.fn();
      const wrappedHandler = withAuth(handler);

      await wrappedHandler(mockReq, mockRes);

      expect(handler).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    it("should pass token to handler", async () => {
      const mockToken = { email: "user@example.com", name: "Test User" };
      getToken.mockResolvedValue(mockToken);

      const handler = jest.fn().mockResolvedValue(undefined);
      const wrappedHandler = withAuth(handler);

      await wrappedHandler(mockReq, mockRes);

      expect(handler).toHaveBeenCalledWith(mockReq, mockRes, mockToken);
    });
  });

  describe("getUserIdFromToken", () => {
    it("should return email when available", () => {
      const token = { email: "test@example.com" };
      expect(getUserIdFromToken(token)).toBe("test@example.com");
    });

    it("should return name when email is not available", () => {
      const token = { name: "Test User" };
      expect(getUserIdFromToken(token)).toBe("Test User");
    });

    it("should return 'unknown' when neither email nor name is available", () => {
      const token = {};
      expect(getUserIdFromToken(token)).toBe("unknown");
    });

    it("should prefer email over name", () => {
      const token = { email: "test@example.com", name: "Test User" };
      expect(getUserIdFromToken(token)).toBe("test@example.com");
    });
  });
});
