import { createHash } from "node:crypto";

/** SHA-256 hex of UTF-8 content. The freshness gate keys on this. */
export function contentSha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}
