import { describe, expect, it } from "vitest";

import { buildEmail, isBot, parseSubmission } from "./submission.js";

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "I would like to talk about an analytical engine.",
};

describe("parseSubmission", () => {
  it("accepts a well-formed submission and trims whitespace", () => {
    const s = parseSubmission(
      JSON.stringify({ ...valid, name: "  Ada Lovelace  " }),
    );
    expect(s.name).toBe("Ada Lovelace");
    expect(s.email).toBe("ada@example.com");
  });

  it("decodes a base64 body (the Function URL's non-text encoding)", () => {
    const body = Buffer.from(JSON.stringify(valid), "utf8").toString("base64");
    expect(parseSubmission(body, true).email).toBe("ada@example.com");
  });

  it("rejects missing, malformed, and oversize input", () => {
    expect(() => parseSubmission("{not json")).toThrow();
    expect(() => parseSubmission(undefined)).toThrow();
    expect(() =>
      parseSubmission(JSON.stringify({ ...valid, name: "" })),
    ).toThrow();
    expect(() =>
      parseSubmission(JSON.stringify({ ...valid, email: "not-an-email" })),
    ).toThrow();
    expect(() =>
      parseSubmission(JSON.stringify({ ...valid, message: "too short" })),
    ).toThrow();
    expect(() =>
      parseSubmission(JSON.stringify({ ...valid, name: "x".repeat(101) })),
    ).toThrow();
    expect(() =>
      parseSubmission(JSON.stringify({ ...valid, message: "x".repeat(5001) })),
    ).toThrow();
    expect(() =>
      parseSubmission(JSON.stringify({ ...valid, company: "x".repeat(201) })),
    ).toThrow();
  });
});

describe("isBot", () => {
  it("is false when the honeypot is absent or blank", () => {
    expect(isBot(parseSubmission(JSON.stringify(valid)))).toBe(false);
    expect(
      isBot(parseSubmission(JSON.stringify({ ...valid, company: "   " }))),
    ).toBe(false);
  });

  it("is true when the honeypot is filled", () => {
    expect(
      isBot(parseSubmission(JSON.stringify({ ...valid, company: "Acme" }))),
    ).toBe(true);
  });
});

describe("buildEmail", () => {
  it("puts the sender in the subject and the details in the body", () => {
    const email = buildEmail(parseSubmission(JSON.stringify(valid)));
    expect(email.subject).toContain("Ada Lovelace");
    expect(email.text).toContain("ada@example.com");
    expect(email.text).toContain("analytical engine");
  });

  it("strips control characters so a name cannot forge a header line", () => {
    const email = buildEmail(
      parseSubmission(
        JSON.stringify({
          ...valid,
          name: "Ada\r\nBcc: victim@example.com",
        }),
      ),
    );
    expect(email.subject).not.toMatch(/[\r\n]/);
    expect(email.subject).toContain("Ada Bcc: victim@example.com");
  });
});
