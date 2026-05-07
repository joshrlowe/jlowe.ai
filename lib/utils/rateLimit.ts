import type { NextApiRequest, NextApiResponse } from "next";
import { getClientIp } from "../observability/ip";

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  keyPrefix?: string;
}

/**
 * Returns true if allowed, false if rate-limited (and 429 already sent).
 * Skips silently when Upstash env vars are absent (fail-open).
 */
export async function checkRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  config: RateLimitConfig,
): Promise<boolean> {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return true;
  }
  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        config.maxRequests,
        `${config.windowSeconds} s`,
      ),
      prefix: config.keyPrefix ?? "ratelimit",
    });
    const ip = getClientIp(req);
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      res
        .status(429)
        .json({ error: "Too many requests. Please try again later." });
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[rateLimit] check failed:", (err as Error).message);
    return true;
  }
}
