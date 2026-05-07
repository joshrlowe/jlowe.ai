import { PrismaClient } from "@prisma/client";

// Extend globalThis to include the prisma client for hot-reload persistence
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Determine log level based on environment
const logConfig: Array<"query" | "error" | "warn" | "info"> =
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
