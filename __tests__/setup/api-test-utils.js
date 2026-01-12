/**
 * Utilities for testing API routes
 */

// Mock Prisma client
export const createMockPrisma = () => ({
  post: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  playlist: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  comment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  like: {
    findFirst: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  $disconnect: jest.fn(),
});

// Mock request/response objects
export const createMockRequest = (options = {}) => ({
  method: "GET",
  query: {},
  body: {},
  headers: {},
  ...options,
});

export const createMockResponse = () => {
  const res = {
    statusCode: 200, // Default status code
    status: jest.fn().mockImplementation(function(code) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
  return res;
};

// Helper to extract JSON response
export const getJsonResponse = (res) => {
  const calls = res.json.mock.calls;
  return calls.length > 0 ? calls[calls.length - 1][0] : null;
};

// Helper to get status code
export const getStatusCode = (res) => {
  const calls = res.status.mock.calls;
  if (calls.length > 0) {
    return calls[calls.length - 1][0];
  }
  // Return statusCode if status() was never called (defaults to 200)
  return res.statusCode;
};
