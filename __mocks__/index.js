/**
 * Mocks Index
 * 
 * Central export point for mock utilities.
 * 
 * Usage:
 * import { server, handlers, errorHandlers } from '@/__mocks__';
 */

// MSW server and handlers
export { server, withHandlers, resetToDefaultHandlers } from './server';
export { handlers, errorHandlers, authenticatedSessionHandler, createSessionHandler } from './handlers';

// Prisma mock utilities
export { default as prisma, resetPrismaMocks, mockPrismaModel } from './prisma';




