/**
 * Mock: lib/prisma (Prisma Client)
 * 
 * Mocks the Prisma database client for testing.
 * All database operations return mock data or empty arrays.
 * 
 * Use jest.spyOn to override specific methods in individual tests:
 * 
 * jest.spyOn(prisma.project, 'findMany').mockResolvedValue([mockProject]);
 */

import { mockProjects, mockProject } from '../__fixtures__/projects';
import { 
  mockWelcome, 
  mockAbout, 
  mockContact, 
  mockPosts, 
  mockPost,
  mockPlaylists,
  mockComments,
  mockSiteSettings,
  mockActivityLogs,
} from '../__fixtures__/api-responses';

/**
 * Creates a mock model with standard Prisma methods
 */
const createMockModel = (defaultData = [], singleItem = null) => ({
  findMany: jest.fn().mockResolvedValue(defaultData),
  findFirst: jest.fn().mockResolvedValue(singleItem),
  findUnique: jest.fn().mockResolvedValue(singleItem),
  create: jest.fn().mockImplementation(({ data }) => 
    Promise.resolve({ id: `mock-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() })
  ),
  update: jest.fn().mockImplementation(({ data, where }) => 
    Promise.resolve({ id: where.id, ...singleItem, ...data, updatedAt: new Date() })
  ),
  upsert: jest.fn().mockImplementation(({ create }) => 
    Promise.resolve({ id: `mock-${Date.now()}`, ...create, createdAt: new Date(), updatedAt: new Date() })
  ),
  delete: jest.fn().mockResolvedValue(singleItem),
  deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  count: jest.fn().mockResolvedValue(defaultData.length),
  aggregate: jest.fn().mockResolvedValue({ _count: defaultData.length }),
  groupBy: jest.fn().mockResolvedValue([]),
  createMany: jest.fn().mockResolvedValue({ count: 0 }),
  updateMany: jest.fn().mockResolvedValue({ count: 0 }),
});

/**
 * Mock Prisma client
 */
const prisma = {
  // Models
  welcome: createMockModel([mockWelcome], mockWelcome),
  about: createMockModel([mockAbout], mockAbout),
  contact: createMockModel([mockContact], mockContact),
  project: createMockModel(mockProjects, mockProject),
  projectTeamMember: createMockModel([]),
  post: createMockModel(mockPosts, mockPost),
  playlist: createMockModel(mockPlaylists),
  playlistPost: createMockModel([]),
  comment: createMockModel(mockComments),
  like: createMockModel([]),
  newsletterSubscription: createMockModel([]),
  adminUser: createMockModel([]),
  siteSettings: createMockModel([mockSiteSettings], mockSiteSettings),
  pageContent: createMockModel([]),
  activityLog: createMockModel(mockActivityLogs),

  // Connection methods
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $executeRaw: jest.fn().mockResolvedValue(0),
  $executeRawUnsafe: jest.fn().mockResolvedValue(0),
  $queryRaw: jest.fn().mockResolvedValue([]),
  $queryRawUnsafe: jest.fn().mockResolvedValue([]),
  $transaction: jest.fn().mockImplementation(async (fn) => {
    if (typeof fn === 'function') {
      return fn(prisma);
    }
    return Promise.all(fn);
  }),
};

export default prisma;

// Named export for ES modules
export { prisma };

/**
 * Helper to reset all Prisma mocks
 */
export const resetPrismaMocks = () => {
  Object.values(prisma).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === 'function' && method.mockClear) {
          method.mockClear();
        }
      });
    }
  });
};

/**
 * Helper to setup specific model mock data
 */
export const mockPrismaModel = (modelName, data) => {
  if (prisma[modelName]) {
    prisma[modelName].findMany.mockResolvedValue(Array.isArray(data) ? data : [data]);
    prisma[modelName].findFirst.mockResolvedValue(Array.isArray(data) ? data[0] : data);
    prisma[modelName].findUnique.mockResolvedValue(Array.isArray(data) ? data[0] : data);
    prisma[modelName].count.mockResolvedValue(Array.isArray(data) ? data.length : 1);
  }
};



