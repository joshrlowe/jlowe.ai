/**
 * Prisma Client Singleton
 *
 * This file ensures a single Prisma Client instance is used throughout the application.
 * In development, this prevents exhausting database connections during hot reloading.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

const prisma = globalForPrisma.prisma;

export default prisma;

// Close the connection when the Node.js process terminates
if (process.env.NODE_ENV !== 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}
