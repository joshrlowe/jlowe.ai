/**
 * Tests for /api/index.js
 *
 * Tests root API endpoint
 */

import apiHandler from '../../pages/api/index.js';
import {
  createMockRequest,
  createMockResponse,
  getJsonResponse,
  getStatusCode,
} from '../setup/api-test-utils.js';

describe('/api', () => {
  it('should return API working message', () => {
    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();

    apiHandler(req, res);

    expect(getStatusCode(res)).toBe(200);
    expect(getJsonResponse(res)).toEqual({ message: 'API is working' });
  });

  it('should work for any HTTP method', () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    methods.forEach((method) => {
      const req = createMockRequest({ method });
      const res = createMockResponse();

      apiHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
      expect(getJsonResponse(res).message).toBe('API is working');
    });
  });
});

