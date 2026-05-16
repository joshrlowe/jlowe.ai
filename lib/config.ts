/**
 * Environment Configuration
 *
 * Centralized environment variable management with validation and defaults.
 * This ensures all environment variables are properly typed and validated.
 */

export interface LangfuseConfig {
  publicKey: string;
  secretKey: string;
  host: string;
}

export interface FunnelConfig {
  resendApiKey: string;
  resendFromEmail: string;
  ownerEmail: string;
  cronSecret: string;
}

export interface CalcomConfig {
  username: string;
  eventTypeSlug: string;
}

export interface Config {
  nodeEnv: string;
  databaseUrl: string;
  nextAuthSecret: string;
  nextAuthUrl: string;
  mongodbUrl: string | null;
  langfuse: LangfuseConfig | null;
  funnel: FunnelConfig | null;
  calcom: CalcomConfig | null;
  inngestEventKey: string | null;
  inngestSigningKey: string | null;
}

/**
 * Validates and returns environment configuration
 */
export function getConfig(): Config {
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

  const lfPublic = process.env.LANGFUSE_PUBLIC_KEY;
  const lfSecret = process.env.LANGFUSE_SECRET_KEY;
  const langfuse: LangfuseConfig | null =
    lfPublic && lfSecret
      ? {
          publicKey: lfPublic,
          secretKey: lfSecret,
          host: process.env.LANGFUSE_HOST || "https://cloud.langfuse.com",
        }
      : null;

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;
  const ownerEmail = process.env.OWNER_EMAIL;
  const cronSecret = process.env.CRON_SECRET;
  const funnel: FunnelConfig | null =
    resendApiKey && resendFromEmail && ownerEmail && cronSecret
      ? { resendApiKey, resendFromEmail, ownerEmail, cronSecret }
      : null;

  const calcomUsername = process.env.CALCOM_USERNAME;
  const calcom: CalcomConfig | null = calcomUsername
    ? {
        username: calcomUsername,
        eventTypeSlug: process.env.CALCOM_EVENT_TYPE_SLUG || "30min",
      }
    : null;

  const inngestEventKey = process.env.INNGEST_EVENT_KEY ?? null;
  const inngestSigningKey = process.env.INNGEST_SIGNING_KEY ?? null;

  return {
    nodeEnv,
    databaseUrl,
    nextAuthSecret,
    nextAuthUrl,
    mongodbUrl,
    langfuse,
    funnel,
    calcom,
    inngestEventKey,
    inngestSigningKey,
  };
}

/**
 * Gets a single config value by key
 */
export function getConfigValue<K extends keyof Config>(key: K): Config[K] {
  const config = getConfig();
  return config[key];
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
}
