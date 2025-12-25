import { PrismaClient } from "@prisma/client";
import { isDevelopment } from "./config.js";

const globalForPrisma = global;

/**
 * Prisma Client instance with optimized logging configuration.
 * 
 * Logging levels:
 * - Development: errors and warnings only (query logging disabled for performance)
 * - Production: errors only
 * 
 * To enable query logging in development, set PRISMA_LOG_QUERIES=true
 */
const prismaLogConfig = isDevelopment()
  ? process.env.PRISMA_LOG_QUERIES === "true"
    ? ["query", "error", "warn"]
    : ["error", "warn"]
  : ["error"];

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: prismaLogConfig,
  });

if (!isDevelopment()) globalForPrisma.prisma = prisma;

export default prisma;
