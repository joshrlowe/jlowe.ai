/**
 * Prisma Client Singleton (Prisma 7)
 *
 * This file ensures a single Prisma Client instance is used throughout the application.
 * In development, this prevents exhausting database connections during hot reloading.
 *
 * Prisma 7 requires passing the database URL directly to the client constructor
 * instead of using the datasource url in schema.prisma
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = global;

// Create PostgreSQL adapter for Prisma 7
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Create a connection pool using node-postgres
  const pool = new pg.Pool({
    connectionString,
  });

  // Create Prisma PostgreSQL adapter
  const adapter = new PrismaPg(pool);

  // Create Prisma Client with the adapter
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createPrismaClient();
}

const prisma = globalForPrisma.prisma;

export default prisma;

// Close the connection when the Node.js process terminates
if (process.env.NODE_ENV !== 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}
