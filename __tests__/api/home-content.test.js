/**
 * Tests for /api/home-content.js
 *
 * Tests home page content API route
 */

import homeContentHandler from '../../pages/api/home-content.js';
import prisma from '../../lib/prisma.js';
import {
  createMockRequest,
  createMockResponse,
  getJsonResponse,
  getStatusCode,
} from '../setup/api-test-utils.js';

jest.mock('../../lib/prisma.js', () => ({
  __esModule: true,
  default: {
    pageContent: {
      findUnique: jest.fn(),
    },
    siteSettings: {
      findFirst: jest.fn(),
    },
  },
}));

describe('/api/home-content', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultHomeContent = {
    typingIntro: 'I build...',
    heroTitle: 'intelligent AI systems',
    typingStrings: expect.arrayContaining([
      'intelligent AI systems',
      'production ML pipelines',
    ]),
    primaryCta: {
      text: 'Start a Project',
      href: '/contact',
    },
    secondaryCta: {
      text: 'View My Work',
      href: '/projects',
    },
    techBadges: expect.arrayContaining([
      expect.objectContaining({ name: 'Python' }),
    ]),
    servicesTitle: 'AI & Engineering Services',
    servicesSubtitle: expect.any(String),
    services: expect.arrayContaining([
      expect.objectContaining({ title: 'AI Strategy & Consulting' }),
    ]),
  };

  describe('GET requests', () => {
    it('should return custom content when available', async () => {
      const customContent = {
        typingIntro: 'Custom intro',
        heroTitle: 'Custom title',
        typingStrings: ['Custom string 1', 'Custom string 2'],
        primaryCta: { text: 'Custom CTA', href: '/custom' },
        secondaryCta: { text: 'Secondary', href: '/secondary' },
        techBadges: [{ name: 'CustomTech', color: '#000000' }],
        servicesTitle: 'Custom Services',
        servicesSubtitle: 'Custom subtitle',
        services: [
          {
            iconKey: 'custom',
            title: 'Custom Service',
            description: 'Custom description',
            variant: 'primary',
          },
        ],
      };

      prisma.pageContent.findUnique.mockResolvedValue({
        pageKey: 'home',
        content: customContent,
      });

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      expect(prisma.pageContent.findUnique).toHaveBeenCalledWith({
        where: { pageKey: 'home' },
      });
      expect(getStatusCode(res)).toBe(200);
      const response = getJsonResponse(res);
      expect(response.typingIntro).toBe('Custom intro');
      expect(response.heroTitle).toBe('Custom title');
    });

    it('should return default content when no custom content exists', async () => {
      prisma.pageContent.findUnique.mockResolvedValue(null);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
      const response = getJsonResponse(res);
      expect(response).toMatchObject(defaultHomeContent);
    });

    it('should merge custom content with defaults', async () => {
      const partialContent = {
        typingIntro: 'Custom intro only',
        // Other fields should fall back to defaults
      };

      prisma.pageContent.findUnique.mockResolvedValue({
        pageKey: 'home',
        content: partialContent,
      });

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.typingIntro).toBe('Custom intro only');
      expect(response.heroTitle).toBeDefined(); // Should have default
      expect(response.techBadges).toBeDefined(); // Should have default
    });

    it('should return defaults when pageContent has null content', async () => {
      prisma.pageContent.findUnique.mockResolvedValue({
        pageKey: 'home',
        content: null,
      });

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
      const response = getJsonResponse(res);
      expect(response).toMatchObject(defaultHomeContent);
    });

    it('should handle database errors gracefully', async () => {
      prisma.pageContent.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
      const response = getJsonResponse(res);
      expect(response).toMatchObject(defaultHomeContent);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should always return valid structure', async () => {
      prisma.pageContent.findUnique.mockResolvedValue(null);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      const response = getJsonResponse(res);
      expect(response).toHaveProperty('typingIntro');
      expect(response).toHaveProperty('heroTitle');
      expect(response).toHaveProperty('typingStrings');
      expect(response).toHaveProperty('primaryCta');
      expect(response).toHaveProperty('secondaryCta');
      expect(response).toHaveProperty('techBadges');
      expect(response).toHaveProperty('servicesTitle');
      expect(response).toHaveProperty('servicesSubtitle');
      expect(response).toHaveProperty('services');
    });

    it('should return arrays for array fields', async () => {
      prisma.pageContent.findUnique.mockResolvedValue(null);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      const response = getJsonResponse(res);
      expect(Array.isArray(response.typingStrings)).toBe(true);
      expect(Array.isArray(response.techBadges)).toBe(true);
      expect(Array.isArray(response.services)).toBe(true);
      expect(response.typingStrings.length).toBeGreaterThan(0);
      expect(response.techBadges.length).toBeGreaterThan(0);
      expect(response.services.length).toBeGreaterThan(0);
    });

    it('should return valid tech badges structure', async () => {
      prisma.pageContent.findUnique.mockResolvedValue(null);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      const response = getJsonResponse(res);
      response.techBadges.forEach((badge) => {
        expect(badge).toHaveProperty('name');
        expect(badge).toHaveProperty('color');
        expect(typeof badge.name).toBe('string');
        expect(typeof badge.color).toBe('string');
      });
    });

    it('should return valid services structure', async () => {
      prisma.pageContent.findUnique.mockResolvedValue(null);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      const response = getJsonResponse(res);
      response.services.forEach((service) => {
        expect(service).toHaveProperty('iconKey');
        expect(service).toHaveProperty('title');
        expect(service).toHaveProperty('description');
        expect(service).toHaveProperty('variant');
      });
    });

    it('should return valid CTA structure', async () => {
      prisma.pageContent.findUnique.mockResolvedValue(null);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.primaryCta).toHaveProperty('text');
      expect(response.primaryCta).toHaveProperty('href');
      expect(response.secondaryCta).toHaveProperty('text');
      expect(response.secondaryCta).toHaveProperty('href');
    });
  });

  describe('HTTP method restrictions', () => {
    it('should return 405 for POST requests', async () => {
      const req = createMockRequest({ method: 'POST' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toBe('Method Not Allowed');
    });

    it('should return 405 for PUT requests', async () => {
      const req = createMockRequest({ method: 'PUT' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toBe('Method Not Allowed');
    });

    it('should return 405 for DELETE requests', async () => {
      const req = createMockRequest({ method: 'DELETE' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });

    it('should return 405 for PATCH requests', async () => {
      const req = createMockRequest({ method: 'PATCH' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty services array in custom content', async () => {
      prisma.pageContent.findUnique.mockResolvedValue({
        pageKey: 'home',
        content: { services: [] },
      });

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      const response = getJsonResponse(res);
      // Empty array is merged, not replaced, so should return empty
      expect(Array.isArray(response.services)).toBe(true);
    });

    it('should handle malformed custom content', async () => {
      prisma.pageContent.findUnique.mockResolvedValue({
        pageKey: 'home',
        content: { invalid: 'data' },
      });

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      const response = getJsonResponse(res);
      // Should merge and fill in defaults
      expect(response).toHaveProperty('typingIntro');
      expect(response).toHaveProperty('heroTitle');
    });

    it('should handle custom content with additional fields', async () => {
      prisma.pageContent.findUnique.mockResolvedValue({
        pageKey: 'home',
        content: {
          typingIntro: 'Custom',
          extraField: 'Should be preserved',
        },
      });

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.extraField).toBe('Should be preserved');
    });

    it('should handle timeout errors', async () => {
      prisma.pageContent.findUnique.mockRejectedValue(
        new Error('Query timeout')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      expect(getStatusCode(res)).toBe(200);
      const response = getJsonResponse(res);
      expect(response).toMatchObject(defaultHomeContent);
      consoleSpy.mockRestore();
    });
  });

  describe('Default content validation', () => {
    it('should have 5 default typing strings', async () => {
      prisma.pageContent.findUnique.mockResolvedValue(null);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.typingStrings.length).toBe(5);
    });

    it('should have 5 default tech badges', async () => {
      prisma.pageContent.findUnique.mockResolvedValue(null);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.techBadges.length).toBe(5);
    });

    it('should have 6 default services', async () => {
      prisma.pageContent.findUnique.mockResolvedValue(null);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await homeContentHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.services.length).toBe(6);
    });
  });
});

