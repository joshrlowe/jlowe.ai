/**
 * Tests for /api/admin/site-settings.js
 *
 * Tests admin site settings API route (GET/PUT)
 */

import siteSettingsHandler from '../../../pages/api/admin/site-settings.js';
import prisma from '../../../lib/prisma.js';
import { getToken } from 'next-auth/jwt';
import {
  createMockRequest,
  createMockResponse,
  getJsonResponse,
  getStatusCode,
} from '../../setup/api-test-utils.js';

// Mock prisma
jest.mock('../../../lib/prisma.js', () => ({
  __esModule: true,
  default: {
    siteSettings: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

describe('/api/admin/site-settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to prevent noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      getToken.mockResolvedValue(null);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await siteSettingsHandler(req, res);

      expect(getStatusCode(res)).toBe(401);
      expect(getJsonResponse(res).message).toBe('Unauthorized');
    });

    it('should proceed when authenticated', async () => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
      prisma.siteSettings.findFirst.mockResolvedValue({
        id: '1',
        siteName: 'Test Site',
        enabledSections: ['hero', 'welcome'],
      });

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await siteSettingsHandler(req, res);

      expect(getStatusCode(res)).not.toBe(401);
    });
  });

  describe('GET requests', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should return existing site settings', async () => {
      const mockSettings = {
        id: '1',
        siteName: 'jlowe.ai',
        navLinks: [{ label: 'Home', href: '/' }],
        footerText: 'Copyright 2024',
        socials: { twitter: '@jlowe' },
        seoDefaults: { title: 'Josh Lowe' },
        enabledSections: ['hero', 'welcome', 'projects'],
      };
      prisma.siteSettings.findFirst.mockResolvedValue(mockSettings);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await siteSettingsHandler(req, res);

      expect(prisma.siteSettings.findFirst).toHaveBeenCalled();
      expect(getJsonResponse(res)).toEqual(mockSettings);
    });

    it('should create default settings if none exist', async () => {
      prisma.siteSettings.findFirst.mockResolvedValue(null);
      const createdSettings = {
        id: '1',
        siteName: 'jlowe.ai',
        navLinks: [],
        footerText: '',
        socials: {},
        seoDefaults: {},
        enabledSections: ['hero', 'welcome', 'projects', 'stats', 'articles'],
      };
      prisma.siteSettings.create.mockResolvedValue(createdSettings);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await siteSettingsHandler(req, res);

      expect(prisma.siteSettings.create).toHaveBeenCalledWith({
        data: {
          siteName: 'jlowe.ai',
          navLinks: [],
          footerText: '',
          socials: {},
          seoDefaults: {},
          enabledSections: ['hero', 'welcome', 'projects', 'stats', 'articles'],
        },
      });
    });

    it('should add default enabledSections if missing from settings', async () => {
      const settingsWithoutSections = {
        id: '1',
        siteName: 'jlowe.ai',
        enabledSections: null,
      };
      prisma.siteSettings.findFirst.mockResolvedValue(settingsWithoutSections);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await siteSettingsHandler(req, res);

      const response = getJsonResponse(res);
      expect(response.enabledSections).toEqual(['hero', 'welcome', 'projects', 'stats', 'articles']);
    });

    it('should handle database errors', async () => {
      prisma.siteSettings.findFirst.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await siteSettingsHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('PUT requests', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should update existing settings', async () => {
      const existingSettings = { id: '1', siteName: 'Old Name' };
      prisma.siteSettings.findFirst.mockResolvedValue(existingSettings);

      const updatedSettings = {
        id: '1',
        siteName: 'New Name',
        navLinks: [{ label: 'Home', href: '/' }],
        footerText: 'New Footer',
        socials: { twitter: '@new' },
        seoDefaults: { title: 'New Title' },
        enabledSections: ['hero', 'welcome'],
      };
      prisma.siteSettings.update.mockResolvedValue(updatedSettings);

      const req = createMockRequest({
        method: 'PUT',
        body: {
          siteName: 'New Name',
          navLinks: [{ label: 'Home', href: '/' }],
          footerText: 'New Footer',
          socials: { twitter: '@new' },
          seoDefaults: { title: 'New Title' },
          enabledSections: ['hero', 'welcome'],
        },
      });
      const res = createMockResponse();

      await siteSettingsHandler(req, res);

      expect(prisma.siteSettings.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          siteName: 'New Name',
          enabledSections: ['hero', 'welcome'],
        }),
      });
      expect(getJsonResponse(res)).toEqual(updatedSettings);
    });

    it('should create settings if none exist on PUT', async () => {
      prisma.siteSettings.findFirst.mockResolvedValue(null);

      const createdSettings = {
        id: '1',
        siteName: 'New Site',
        navLinks: [],
        footerText: '',
        socials: {},
        seoDefaults: {},
        enabledSections: ['hero', 'welcome'],
      };
      prisma.siteSettings.create.mockResolvedValue(createdSettings);

      const req = createMockRequest({
        method: 'PUT',
        body: {
          siteName: 'New Site',
          enabledSections: ['hero', 'welcome'],
        },
      });
      const res = createMockResponse();

      await siteSettingsHandler(req, res);

      expect(prisma.siteSettings.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          siteName: 'New Site',
          enabledSections: ['hero', 'welcome'],
        }),
      });
    });

    it('should use default enabledSections if not provided as array', async () => {
      const existingSettings = { id: '1', siteName: 'Test' };
      prisma.siteSettings.findFirst.mockResolvedValue(existingSettings);
      prisma.siteSettings.update.mockResolvedValue({
        ...existingSettings,
        enabledSections: ['hero', 'welcome', 'projects', 'stats', 'articles'],
      });

      const req = createMockRequest({
        method: 'PUT',
        body: {
          siteName: 'Test',
          enabledSections: 'not-an-array',
        },
      });
      const res = createMockResponse();

      await siteSettingsHandler(req, res);

      expect(prisma.siteSettings.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          enabledSections: ['hero', 'welcome', 'projects', 'stats', 'articles'],
        }),
      });
    });

    it('should handle database errors', async () => {
      prisma.siteSettings.findFirst.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({
        method: 'PUT',
        body: { siteName: 'Test' },
      });
      const res = createMockResponse();

      await siteSettingsHandler(req, res);

      expect(getStatusCode(res)).toBe(500);
    });
  });

  describe('HTTP method restrictions', () => {
    beforeEach(() => {
      getToken.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
    });

    it('should return 405 for POST requests', async () => {
      const req = createMockRequest({ method: 'POST' });
      const res = createMockResponse();

      await siteSettingsHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
      expect(getJsonResponse(res).message).toBe('Method Not Allowed');
    });

    it('should return 405 for DELETE requests', async () => {
      const req = createMockRequest({ method: 'DELETE' });
      const res = createMockResponse();

      await siteSettingsHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });

    it('should return 405 for PATCH requests', async () => {
      const req = createMockRequest({ method: 'PATCH' });
      const res = createMockResponse();

      await siteSettingsHandler(req, res);

      expect(getStatusCode(res)).toBe(405);
    });
  });
});

