import type { NextApiRequest } from "next";
import crypto from "node:crypto";

const IP_HASH_LEN = 16;

export function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return (
    (req.headers["x-real-ip"] as string) ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

/**
 * SHA-256 hash of an IP, truncated to 16 hex chars. Suitable for clustering
 * traces by client without storing the raw address.
 */
export function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, IP_HASH_LEN);
}
