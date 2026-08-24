/**
 * Nightly qualified-lead digest. EventBridge is the only invoker (no Function
 * URL, no CRON_SECRET). Queries the sparse `digest` GSI — every item already
 * satisfies `qualified && !emailedToOwner`, so there is no filter and no scan.
 *
 * Fail closed on SES: if the send throws we do not mark sessions emailed, so
 * the next night retries. An empty pending set is a successful no-op.
 */

import type { ChatSession, SessionStore } from "./sessions.js";
import { renderQualifiedLeadsDigest } from "./digest-email.js";

export interface DigestMail {
  subject: string;
  html: string;
  text: string;
}

export interface DigestDeps {
  store: Pick<SessionStore, "listPending" | "update">;
  send: (mail: DigestMail) => Promise<void>;
  now?: Date;
}

export async function runDigest(
  deps: DigestDeps,
): Promise<{ sent: number; sessionIds: string[] }> {
  const sessions: ChatSession[] = await deps.store.listPending();
  if (sessions.length === 0) {
    return { sent: 0, sessionIds: [] };
  }
  const mail = renderQualifiedLeadsDigest(sessions, deps.now);
  await deps.send(mail);
  for (const session of sessions) {
    await deps.store.update(session.sessionId, { emailedToOwner: true });
  }
  return {
    sent: sessions.length,
    sessionIds: sessions.map((s) => s.sessionId),
  };
}
