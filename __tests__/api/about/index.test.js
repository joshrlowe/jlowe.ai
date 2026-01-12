/**
 * Tests for /api/about/index.js
 *
 * Tests about page data API route
 */

import aboutHandler from '../../../pages/api/about/index.js';
import prisma from '../../../lib/prisma.js';
import {
  createMockRequest,
  createMockResponse,
  getJsonResponse,
  getStatusCode,
} from '../../setup/api-test-utils.js';

jest.mock('../../../lib/prisma.js', () => ({
  __esModule: true,
  default: {
    about: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('/api/about', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validAboutData = {
    professionalSummary: 'AI/ML Engineer with 5+ years of experience',
    technicalSkills: ['Python', 'TensorFlow', 'React'],
    professionalExperience: [
      {
        title: 'Senior AI Engineer',
        company: 'Tech Corp',
        startDate: '2020-01-01',
        endDate: null,
      },
    ],
    education: [
      {
        degree: 'MS Computer Science',
        institution: 'University',
        year: '2019',
      },
    ],
    technicalCertifications: ['AWS Certified'],
    leadershipExperience: ['Led team of 5 engineers'],
    hobbies: ['Reading', 'Hiking'],
  };

  describe('GET requests', () => {
    it('should return latest about data with 200', async () => {
      const mockAbout = {
        id: '1',
        ...validAboutData,
        createdAt: new Date(),
      };

      prisma.about.findFirst.mockResolvedValue(mockAbout);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(prisma.about.findFirst).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(getStatusCode(res)).toBe(200);
      expect(getJsonResponse(res)).toEqual(mockAbout);
    });

    it('should return 404 when no about data exists', async () => {
      prisma.about.findFirst.mockResolvedValue(null);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(404);
      expect(getJsonResponse(res).message).toContain('About data not found');
    });

    it('should handle database errors with 500', async () => {
      prisma.about.findFirst.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('POST requests', () => {
    it('should create about data with valid input', async () => {
      const mockCreatedAbout = {
        id: '1',
        ...validAboutData,
        createdAt: new Date(),
      };

      prisma.about.deleteMany.mockResolvedValue({ count: 0 });
      prisma.about.create.mockResolvedValue(mockCreatedAbout);

      const req = createMockRequest({
        method: 'POST',
        body: validAboutData,
      });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(prisma.about.deleteMany).toHaveBeenCalled();
      expect(prisma.about.create).toHaveBeenCalledWith({
        data: validAboutData,
      });
      expect(getStatusCode(res)).toBe(201);
      expect(getJsonResponse(res)).toEqual(mockCreatedAbout);
    });

    it('should return 400 when professionalSummary is missing', async () => {
      const invalidData = { ...validAboutData };
      delete invalidData.professionalSummary;

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('professionalSummary');
    });

    it('should return 400 when technicalSkills is not an array', async () => {
      const invalidData = {
        ...validAboutData,
        technicalSkills: 'Not an array',
      };

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('technicalSkills');
    });

    it('should return 400 when professionalExperience is not an array', async () => {
      const invalidData = {
        ...validAboutData,
        professionalExperience: 'Not an array',
      };

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('professionalExperience');
    });

    it('should return 400 when education is not an array', async () => {
      const invalidData = {
        ...validAboutData,
        education: 'Not an array',
      };

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('education');
    });

    it('should return 400 when technicalCertifications is not an array', async () => {
      const invalidData = {
        ...validAboutData,
        technicalCertifications: 'Not an array',
      };

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('technicalCertifications');
    });

    it('should return 400 when leadershipExperience is not an array', async () => {
      const invalidData = {
        ...validAboutData,
        leadershipExperience: 'Not an array',
      };

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('leadershipExperience');
    });

    it('should return 400 when hobbies is not an array', async () => {
      const invalidData = {
        ...validAboutData,
        hobbies: 'Not an array',
      };

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
      expect(getJsonResponse(res).message).toContain('hobbies');
    });

    it('should handle empty arrays', async () => {
      const dataWithEmptyArrays = {
        ...validAboutData,
        technicalSkills: [],
        hobbies: [],
      };

      prisma.about.deleteMany.mockResolvedValue({ count: 0 });
      prisma.about.create.mockResolvedValue({
        id: '1',
        ...dataWithEmptyArrays,
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithEmptyArrays,
      });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
    });

    it('should delete existing about before creating new one', async () => {
      prisma.about.deleteMany.mockResolvedValue({ count: 1 });
      prisma.about.create.mockResolvedValue({
        id: '2',
        ...validAboutData,
      });

      const req = createMockRequest({
        method: 'POST',
        body: validAboutData,
      });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(prisma.about.deleteMany).toHaveBeenCalledTimes(1);
      expect(prisma.about.create).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors with 500', async () => {
      prisma.about.deleteMany.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({
        method: 'POST',
        body: validAboutData,
      });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('HTTP method restrictions', () => {
    it('should return 405 for PUT requests', async () => {
      const req = createMockRequest({ method: 'PUT' });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toContain('Method Not Allowed');
    });

    it('should return 405 for DELETE requests', async () => {
      const req = createMockRequest({ method: 'DELETE' });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });

    it('should return 405 for PATCH requests', async () => {
      const req = createMockRequest({ method: 'PATCH' });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });

  describe('Edge cases', () => {
    it('should handle null professionalSummary', async () => {
      const invalidData = {
        ...validAboutData,
        professionalSummary: null,
      };

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
    });

    it('should handle undefined fields', async () => {
      const invalidData = {
        professionalSummary: 'Summary',
        technicalSkills: undefined,
        professionalExperience: [],
        education: [],
        technicalCertifications: [],
        leadershipExperience: [],
        hobbies: [],
      };

      const req = createMockRequest({
        method: 'POST',
        body: invalidData,
      });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(400);
    });

    it('should handle very long arrays', async () => {
      const dataWithLongArrays = {
        ...validAboutData,
        technicalSkills: Array(1000).fill('Skill'),
      };

      prisma.about.deleteMany.mockResolvedValue({ count: 0 });
      prisma.about.create.mockResolvedValue({
        id: '1',
        ...dataWithLongArrays,
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithLongArrays,
      });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
    });

    it('should handle special characters in strings', async () => {
      const dataWithSpecialChars = {
        ...validAboutData,
        professionalSummary: "AI Engineer with <script>alert('xss')</script>",
      };

      prisma.about.deleteMany.mockResolvedValue({ count: 0 });
      prisma.about.create.mockResolvedValue({
        id: '1',
        ...dataWithSpecialChars,
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithSpecialChars,
      });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
    });

    it('should handle complex nested objects in experience', async () => {
      const dataWithComplexObjects = {
        ...validAboutData,
        professionalExperience: [
          {
            title: 'Senior Engineer',
            company: 'Tech Corp',
            startDate: '2020-01-01',
            endDate: null,
            achievements: ['Led team', 'Built system'],
            technologies: ['Python', 'React'],
          },
        ],
      };

      prisma.about.deleteMany.mockResolvedValue({ count: 0 });
      prisma.about.create.mockResolvedValue({
        id: '1',
        ...dataWithComplexObjects,
      });

      const req = createMockRequest({
        method: 'POST',
        body: dataWithComplexObjects,
      });
      const res = createMockResponse();

      await aboutHandler(req, res);

      expect(getStatusCode(res)).toBe(201);
    });
  });
});

