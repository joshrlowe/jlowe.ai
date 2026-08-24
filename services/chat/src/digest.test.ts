import { describe, expect, it } from "vitest";

import { renderQualifiedLeadsDigest } from "./digest-email.js";
import { runDigest } from "./digest.js";
import { MemorySessionStore } from "./memory-store.js";
import { DIGEST_PK_VALUE } from "./sessions.js";

describe("renderQualifiedLeadsDigest", () => {
  it("keeps PII out of the subject", () => {
    const session = {
      sessionId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      capturedName: "Ada Lovelace",
      capturedEmail: "ada@example.com",
      topIntent: "evaluating",
      messages: [
        {
          role: "user" as const,
          content: "I want a RAG funnel",
          createdAt: "2026-08-24T00:00:00.000Z",
          intent: "evaluating",
        },
      ],
    };
    const rendered = renderQualifiedLeadsDigest(
      [
        {
          sessionId: session.sessionId,
          ipHash: "x",
          userAgent: null,
          qualified: true,
          bookingOffered: false,
          emailedToOwner: false,
          topIntent: session.topIntent,
          capturedName: session.capturedName,
          capturedEmail: session.capturedEmail,
          createdAt: "2026-08-24T00:00:00.000Z",
          updatedAt: "2026-08-24T00:00:00.000Z",
          expiresAt: 0,
          windowStartMs: 0,
          requestCount: 1,
          messages: session.messages,
        },
      ],
      new Date("2026-08-24T12:00:00.000Z"),
    );
    expect(rendered.subject).toBe("Qualified leads — 2026-08-24 (1 session)");
    expect(rendered.subject).not.toContain("Ada");
    expect(rendered.subject).not.toContain("ada@");
    expect(rendered.html).toContain("Ada Lovelace");
    expect(rendered.text).toContain("I want a RAG funnel");
  });
});

describe("runDigest", () => {
  it("is a no-op when the sparse GSI is empty", async () => {
    const store = new MemorySessionStore();
    let sent = 0;
    const result = await runDigest({
      store,
      send: async () => {
        sent += 1;
      },
    });
    expect(result).toEqual({ sent: 0, sessionIds: [] });
    expect(sent).toBe(0);
  });

  it("sends one email then drops GSI keys by marking emailedToOwner", async () => {
    const store = new MemorySessionStore();
    await store.checkRateLimit("s1", { ipHash: "h", userAgent: null }, 1);
    await store.update("s1", { qualified: true });
    expect(store.snapshot("s1")?.digestPk).toBe(DIGEST_PK_VALUE);

    const mails: { subject: string }[] = [];
    const result = await runDigest({
      store,
      send: async (mail) => {
        mails.push(mail);
      },
      now: new Date("2026-08-24T12:00:00.000Z"),
    });
    expect(result.sent).toBe(1);
    expect(mails).toHaveLength(1);
    expect(store.snapshot("s1")?.emailedToOwner).toBe(true);
    expect(store.snapshot("s1")?.digestPk).toBeUndefined();
    expect(await store.listPending()).toEqual([]);
  });

  it("does not mark emailed when SES throws (retry next night)", async () => {
    const store = new MemorySessionStore();
    await store.checkRateLimit("s1", { ipHash: "h", userAgent: null }, 1);
    await store.update("s1", { qualified: true });
    await expect(
      runDigest({
        store,
        send: async () => {
          throw new Error("ses down");
        },
      }),
    ).rejects.toThrow("ses down");
    expect(store.snapshot("s1")?.emailedToOwner).toBe(false);
    expect(store.snapshot("s1")?.digestPk).toBe(DIGEST_PK_VALUE);
  });
});
