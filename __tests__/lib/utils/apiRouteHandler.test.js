/**
 * Tests for apiRouteHandler utility functions
 *
 * Following TDD: Tests written before refactoring to ensure behavior preservation
 */

import {
  createApiHandler,
  createGetLatestHandler,
  createUpsertHandler,
} from "@/lib/utils/apiRouteHandler";

describe("apiRouteHandler utilities", () => {
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

  describe("createApiHandler", () => {
    it("should call the correct handler for the request method", async () => {
      const getHandler = jest.fn();
      const postHandler = jest.fn();
      const handler = createApiHandler({
        GET: getHandler,
        POST: postHandler,
      });

      mockReq.method = "GET";
      await handler(mockReq, mockRes);

      expect(getHandler).toHaveBeenCalledWith(mockReq, mockRes);
      expect(postHandler).not.toHaveBeenCalled();
    });

    it("should return 405 for unsupported methods", async () => {
      const handler = createApiHandler({
        GET: jest.fn(),
      });

      mockReq.method = "PUT";
      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Method Not Allowed",
      });
    });

    it("should handle errors with handleApiError", async () => {
      const error = new Error("Test error");
      const handler = createApiHandler({
        GET: jest.fn().mockRejectedValue(error),
      });

      mockReq.method = "GET";
      await handler(mockReq, mockRes);

      // Error should be caught and handled (specific assertion depends on handleApiError implementation)
      expect(mockRes.status).toHaveBeenCalled();
    });
  });

  describe("createGetLatestHandler", () => {
    it("should return data when found", async () => {
      const mockData = { id: "1", name: "Test" };
      const findLatestFn = jest.fn().mockResolvedValue(mockData);
      const handler = createGetLatestHandler(findLatestFn);

      await handler(mockReq, mockRes);

      expect(findLatestFn).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockData);
    });

    it("should return 404 when data not found", async () => {
      const findLatestFn = jest.fn().mockResolvedValue(null);
      const handler = createGetLatestHandler(
        findLatestFn,
        "Custom not found message",
      );

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Custom not found message",
      });
    });

    it("should handle errors", async () => {
      const error = new Error("Database error");
      const findLatestFn = jest.fn().mockRejectedValue(error);
      const handler = createGetLatestHandler(findLatestFn);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalled();
    });
  });

  describe("createUpsertHandler", () => {
    it("should delete all and create new record when validation passes", async () => {
      const deleteAllFn = jest.fn().mockResolvedValue();
      const createFn = jest.fn().mockResolvedValue({ id: "1", name: "Test" });
      const validateFn = jest.fn().mockReturnValue({ isValid: true });
      const handler = createUpsertHandler(deleteAllFn, createFn, validateFn);

      mockReq.body = { name: "Test" };
      await handler(mockReq, mockRes);

      expect(validateFn).toHaveBeenCalledWith(mockReq.body);
      expect(deleteAllFn).toHaveBeenCalled();
      expect(createFn).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ id: "1", name: "Test" });
    });

    it("should return 400 when validation fails", async () => {
      const deleteAllFn = jest.fn();
      const createFn = jest.fn();
      const validateFn = jest.fn().mockReturnValue({
        isValid: false,
        message: "Missing required fields",
      });
      const handler = createUpsertHandler(deleteAllFn, createFn, validateFn);

      mockReq.body = {};
      await handler(mockReq, mockRes);

      expect(validateFn).toHaveBeenCalled();
      expect(deleteAllFn).not.toHaveBeenCalled();
      expect(createFn).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Missing required fields",
      });
    });

    it("should work without validation function", async () => {
      const deleteAllFn = jest.fn().mockResolvedValue();
      const createFn = jest.fn().mockResolvedValue({ id: "1" });
      const handler = createUpsertHandler(deleteAllFn, createFn);

      mockReq.body = { name: "Test" };
      await handler(mockReq, mockRes);

      expect(deleteAllFn).toHaveBeenCalled();
      expect(createFn).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle errors", async () => {
      const error = new Error("Database error");
      const deleteAllFn = jest.fn().mockRejectedValue(error);
      const createFn = jest.fn();
      const validateFn = jest.fn().mockReturnValue({ isValid: true });
      const handler = createUpsertHandler(deleteAllFn, createFn, validateFn);

      mockReq.body = { name: "Test" };
      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalled();
    });
  });
});
