/**
 * Tests for lib/utils/activityLogger.js
 *
 * Tests activity logging functionality
 */

import { logActivity } from '../../../lib/utils/activityLogger.js';
import prisma from '../../../lib/prisma.js';

// Mock prisma
jest.mock('../../../lib/prisma.js', () => ({
  __esModule: true,
  default: {
    activityLog: {
      create: jest.fn(),
    },
  },
}));

describe('activityLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('logActivity', () => {
    it('should create activity log with all fields', async () => {
      prisma.activityLog.create.mockResolvedValue({ id: '1' });

      await logActivity({
        userId: 'user-123',
        entityType: 'Project',
        entityId: 'project-456',
        projectId: 'project-456',
        action: 'create',
        field: 'title',
        oldValue: 'Old Title',
        newValue: 'New Title',
        description: 'Updated project title',
        metadata: { source: 'admin' },
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          entityType: 'Project',
          entityId: 'project-456',
          projectId: 'project-456',
          action: 'create',
          field: 'title',
          oldValue: { value: 'Old Title' },
          newValue: { value: 'New Title' },
          description: 'Updated project title',
          metadata: { source: 'admin' },
        },
      });
    });

    it('should handle object values without wrapping', async () => {
      prisma.activityLog.create.mockResolvedValue({ id: '1' });

      await logActivity({
        entityType: 'Project',
        entityId: 'project-456',
        action: 'update',
        oldValue: { name: 'Old', status: 'Draft' },
        newValue: { name: 'New', status: 'Published' },
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          oldValue: { name: 'Old', status: 'Draft' },
          newValue: { name: 'New', status: 'Published' },
        }),
      });
    });

    it('should handle null userId', async () => {
      prisma.activityLog.create.mockResolvedValue({ id: '1' });

      await logActivity({
        userId: null,
        entityType: 'Post',
        entityId: 'post-123',
        action: 'view',
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
        }),
      });
    });

    it('should handle undefined userId', async () => {
      prisma.activityLog.create.mockResolvedValue({ id: '1' });

      await logActivity({
        entityType: 'Post',
        entityId: 'post-123',
        action: 'view',
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
        }),
      });
    });

    it('should handle null optional fields', async () => {
      prisma.activityLog.create.mockResolvedValue({ id: '1' });

      await logActivity({
        entityType: 'Post',
        entityId: 'post-123',
        action: 'delete',
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          userId: null,
          entityType: 'Post',
          entityId: 'post-123',
          projectId: null,
          action: 'delete',
          field: null,
          oldValue: null,
          newValue: null,
          description: null,
          metadata: null,
        },
      });
    });

    it('should not throw on database error', async () => {
      prisma.activityLog.create.mockRejectedValue(new Error('Database error'));

      await expect(
        logActivity({
          entityType: 'Project',
          entityId: 'project-123',
          action: 'update',
        })
      ).resolves.toBeUndefined();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to log activity:',
        expect.any(Error)
      );
    });

    it('should handle string values and wrap them', async () => {
      prisma.activityLog.create.mockResolvedValue({ id: '1' });

      await logActivity({
        entityType: 'Project',
        entityId: 'project-123',
        action: 'update',
        oldValue: 'string value',
        newValue: 123, // number should also be wrapped
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          oldValue: { value: 'string value' },
          newValue: { value: 123 },
        }),
      });
    });

    it('should handle empty description', async () => {
      prisma.activityLog.create.mockResolvedValue({ id: '1' });

      await logActivity({
        entityType: 'Project',
        entityId: 'project-123',
        action: 'create',
        description: '',
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: null, // empty string should become null
        }),
      });
    });
  });
});

