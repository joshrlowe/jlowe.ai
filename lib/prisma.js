import { PrismaClient } from "@prisma/client";

// Use globalThis to persist the Prisma client across hot reloads in development
// This is the official Prisma recommendation for Next.js
const globalForPrisma = globalThis;

// Determine log level based on environment
const logConfig =
  process.env.NODE_ENV === "development"
    ? process.env.PRISMA_LOG_QUERIES === "true"
      ? ["query", "error", "warn"]
      : ["error", "warn"]
    : ["error"];

// Create or reuse the Prisma client
// Use nullish coalescing (??) to only create a new client if one doesn't exist
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logConfig,
  });

// Cache the client in non-production environments to prevent connection pool exhaustion
// This ensures hot reloads in development don't create new database connections
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
