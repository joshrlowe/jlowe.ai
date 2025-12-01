/**
 * Prisma 7 Configuration
 *
 * This file configures the database connection for Prisma Migrate.
 * In Prisma 7, connection URLs are configured here instead of in schema.prisma.
 */

import { defineConfig } from '@prisma/client';

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
