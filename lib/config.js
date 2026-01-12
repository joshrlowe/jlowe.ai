/**
 * Environment Configuration
 *
 * Centralized environment variable management with validation and defaults.
 * This ensures all environment variables are properly typed and validated.
 */

/**
 * @typedef {Object} Config
 * @property {string} nodeEnv - Node environment (development, production, test)
 * @property {string} databaseUrl - PostgreSQL database connection URL
 * @property {string} nextAuthSecret - NextAuth.js secret for JWT signing
 * @property {string} nextAuthUrl - NextAuth.js base URL
 * @property {string} [mongodbUrl] - MongoDB connection URL (optional, for migrations only)
 */

/**
 * Validates and returns environment configuration
 *
 * @returns {Config} Environment configuration object
 * @throws {Error} If required environment variables are missing
 */
export function getConfig() {
  const nodeEnv = process.env.NODE_ENV || "development";

  // Required environment variables
  const databaseUrl =
    process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL or PRISMA_DATABASE_URL must be set in environment variables",
    );
  }

  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  if (!nextAuthSecret) {
    throw new Error("NEXTAUTH_SECRET must be set in environment variables");
  }

  // Optional environment variables with defaults
  const nextAuthUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const mongodbUrl = process.env.MONGODB_URL || process.env.MONGODB_URI || null;

  return {
    nodeEnv,
    databaseUrl,
    nextAuthSecret,
    nextAuthUrl,
    mongodbUrl,
  };
}

/**
 * Gets a single config value by key
 *
 * @param {keyof Config} key - Configuration key
 * @returns {Config[keyof Config]} Configuration value
 */
export function getConfigValue(key) {
  const config = getConfig();
  return config[key];
}

/**
 * Check if running in production
 *
 * @returns {boolean} True if in production environment
 */
export function isProduction() {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if running in development
 *
 * @returns {boolean} True if in development environment
 */
export function isDevelopment() {
  return process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
}
