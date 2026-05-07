import { renderQualifiedLeadsDigest } from "@/lib/email/templates/qualified-leads";

function makeSession(overrides: Partial<Parameters<typeof renderQualifiedLeadsDigest>[0][number]> = {}) {
  return {
    id: "sess-1",
    sessionId: "abcdef0123456789",
    qualified: true,
    topIntent: "evaluating",
    capturedEmail: "lead@acme.com",
    capturedName: "Sarah",
    langfuseTraceIds: ["trace-1234"],
    createdAt: new Date("2026-05-01T15:30:00Z"),
    messages: [
      {
        role: "user",
        content: "I'm building a support bot, do you consult?",
        intent: "evaluating",
        createdAt: new Date("2026-05-01T15:30:00Z"),
      },
      {
        role: "assistant",
        content: "Yes! I work on systems like that. Want to chat?",
        createdAt: new Date("2026-05-01T15:30:05Z"),
      },
    ],
    ...overrides,
  };
}

describe("renderQualifiedLeadsDigest", () => {
  it("subject contains date and count", () => {
    const result = renderQualifiedLeadsDigest([makeSession(), makeSession()]);
    expect(result.subject).toMatch(/Qualified leads — \d{4}-\d{2}-\d{2}/);
    expect(result.subject).toContain("(2 sessions)");
  });

  it("uses singular for one session", () => {
    const result = renderQualifiedLeadsDigest([makeSession()]);
    expect(result.subject).toContain("(1 session)");
  });

  it("HTML includes captured name and email", () => {
    const { html } = renderQualifiedLeadsDigest([makeSession()]);
    expect(html).toContain("Sarah");
    expect(html).toContain("lead@acme.com");
  });

  it("HTML includes both turns of the transcript", () => {
    const { html } = renderQualifiedLeadsDigest([makeSession()]);
    expect(html).toContain("I&#39;m building a support bot, do you consult?");
    expect(html).toContain("Yes! I work on systems like that.");
  });

  it("HTML escapes user content", () => {
    const session = makeSession({
      messages: [
        {
          role: "user",
          content: "<script>alert(1)</script>",
          intent: "evaluating",
          createdAt: new Date(),
        },
      ],
    });
    const { html } = renderQualifiedLeadsDigest([session]);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("HTML includes a Langfuse trace link", () => {
    const { html } = renderQualifiedLeadsDigest([makeSession()]);
    expect(html).toMatch(/href="https?:\/\/[^"]*\/trace\/trace-1234"/);
  });

  it("text body has the same content", () => {
    const { text } = renderQualifiedLeadsDigest([makeSession()]);
    expect(text).toContain("Qualified leads");
    expect(text).toContain("Sarah");
    expect(text).toContain("VISITOR [evaluating]");
    expect(text).toContain("VULTURE");
  });
});
