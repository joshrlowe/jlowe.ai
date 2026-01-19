/**
 * Tests for lib/utils/apiErrorHandler.js
 *
 * Tests centralized error handling for API routes
 */

import { handleApiError } from '../../../lib/utils/apiErrorHandler.js';

// Mock the config module
jest.mock('../../../lib/config.js', () => ({
  isDevelopment: jest.fn(() => false),
}));

import { isDevelopment } from '../../../lib/config.js';

describe('apiErrorHandler', () => {
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to production mode by default
    isDevelopment.mockReturnValue(false);

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock console.error to prevent test noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('Prisma errors', () => {
    it('should handle P2002 (unique constraint violation) with 409 status', () => {
      const error = {
        code: 'P2002',
        meta: { target: ['email'] },
        message: 'Unique constraint failed',
      };

      handleApiError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'A record with this email already exists',
        code: 'P2002',
      });
    });

    it('should handle P2002 without meta.target', () => {
      const error = {
        code: 'P2002',
        message: 'Unique constraint failed',
      };

      handleApiError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'A record with this field already exists',
        code: 'P2002',
      });
    });

    it('should handle P2025 (record not found) with 404 status', () => {
      const error = {
        code: 'P2025',
        message: 'Record to delete does not exist',
      };

      handleApiError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Record not found',
        code: 'P2025',
      });
    });

    it('should handle P2003 (foreign key violation) with 400 status', () => {
      const error = {
        code: 'P2003',
        message: 'Foreign key constraint failed',
      };

      handleApiError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid reference: related record does not exist',
        code: 'P2003',
      });
    });

    it('should handle P2014 (invalid ID) with 400 status', () => {
      const error = {
        code: 'P2014',
        message: 'Invalid ID',
      };

      handleApiError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'P2014',
        })
      );
    });

    it('should handle P2000 (value too long) with 400 status', () => {
      const error = {
        code: 'P2000',
        message: 'Value too long',
      };

      handleApiError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle P2001 (record does not exist) with 404 status', () => {
      const error = {
        code: 'P2001',
        message: 'Record does not exist',
      };

      handleApiError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should handle unknown Prisma error with 400 status', () => {
      const error = {
        code: 'P9999',
        message: 'Unknown Prisma error',
      };

      handleApiError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should include details in development mode', () => {
      isDevelopment.mockReturnValue(true);
      const error = {
        code: 'P2002',
        meta: { target: ['email'] },
        message: 'Unique constraint failed',
      };

      handleApiError(error, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'A record with this email already exists',
        code: 'P2002',
        details: { target: ['email'] },
      });
    });
  });

  describe('Validation errors', () => {
    it('should handle ValidationError with 400 status', () => {
      const error = {
        name: 'ValidationError',
        message: 'Title is required',
      };

      handleApiError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Title is required',
        code: 'VALIDATION_ERROR',
      });
    });

    it('should handle error with VALIDATION_ERROR code', () => {
      const error = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
      };

      handleApiError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid input',
        code: 'VALIDATION_ERROR',
      });
    });

    it('should use default message for validation error without message', () => {
      const error = {
        name: 'ValidationError',
      };

      handleApiError(error, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
      });
    });

    it('should include details in development mode', () => {
      isDevelopment.mockReturnValue(true);
      const error = {
        name: 'ValidationError',
        message: 'Invalid email',
        details: { field: 'email' },
      };

      handleApiError(error, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid email',
        code: 'VALIDATION_ERROR',
        details: { field: 'email' },
      });
    });
  });

  describe('Authentication errors', () => {
    it('should handle UnauthorizedError with 401 status', () => {
      const error = {
        name: 'UnauthorizedError',
        message: 'Invalid token',
      };

      handleApiError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    });

    it('should handle error with statusCode 401', () => {
      const error = {
        statusCode: 401,
        message: 'Token expired',
      };

      handleApiError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    });

    it('should include details in development mode', () => {
      isDevelopment.mockReturnValue(true);
      const error = {
        name: 'UnauthorizedError',
        message: 'JWT expired',
      };

      handleApiError(error, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
        details: 'JWT expired',
      });
    });
  });

  describe('Generic errors with statusCode', () => {
    it('should handle error with custom statusCode', () => {
      const error = {
        statusCode: 403,
        message: 'Forbidden',
        code: 'FORBIDDEN',
      };

      handleApiError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Forbidden',
        code: 'FORBIDDEN',
      });
    });

    it('should use default message for error without message', () => {
      const error = {
        statusCode: 418,
      };

      handleApiError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(418);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'An error occurred',
        code: 'ERROR',
      });
    });

    it('should include stack trace in development mode', () => {
      isDevelopment.mockReturnValue(true);
      const error = {
        statusCode: 403,
        message: 'Forbidden',
        stack: 'Error: Forbidden\n    at ...',
      };

      handleApiError(error, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Forbidden',
        code: 'ERROR',
        details: 'Error: Forbidden\n    at ...',
      });
    });
  });

  describe('Default error handling', () => {
    it('should return 500 for unknown errors', () => {
      const error = new Error('Something went wrong');

      handleApiError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Internal Server Error',
        code: 'INTERNAL_ERROR',
      });
    });

    it('should include error details in development mode', () => {
      isDevelopment.mockReturnValue(true);
      const error = new Error('Database connection failed');
      error.stack = 'Error: Database connection failed\n    at ...';

      handleApiError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Internal Server Error',
        code: 'INTERNAL_ERROR',
        details: {
          message: 'Database connection failed',
          stack: 'Error: Database connection failed\n    at ...',
        },
      });
    });

    it('should log error in development mode', () => {
      isDevelopment.mockReturnValue(true);
      const error = new Error('Test error');

      handleApiError(error, mockRes);

      expect(console.error).toHaveBeenCalledWith(
        'API Error:',
        expect.objectContaining({
          message: 'Test error',
        })
      );
    });

    it('should log error message only in production mode', () => {
      isDevelopment.mockReturnValue(false);
      const error = new Error('Test error');

      handleApiError(error, mockRes);

      expect(console.error).toHaveBeenCalledWith('API Error:', 'Test error');
    });
  });
});

