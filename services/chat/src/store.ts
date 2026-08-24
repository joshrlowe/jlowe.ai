import { DynamoSessionStore } from "./dynamo-store.js";
import { MemorySessionStore } from "./memory-store.js";
import type { SessionStore } from "./sessions.js";

let dynamoStore: SessionStore | undefined;

/**
 * Prod: DynamoDB when Terraform has set `CHAT_SESSIONS_TABLE`. Tests and a
 * mis-provisioned function fall back to a per-invoke memory store (fail-open:
 * chat still answers; rate-limit and persistence don't span invokes).
 */
export function defaultSessionStore(): SessionStore {
  const table = process.env.CHAT_SESSIONS_TABLE;
  if (table) {
    return (dynamoStore ??= new DynamoSessionStore(table));
  }
  return new MemorySessionStore();
}
