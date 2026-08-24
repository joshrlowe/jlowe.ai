import { afterEach, describe, expect, it, vi } from "vitest";

import { CONTACT_LIMITS, submitContact, validateContact } from "./submit";

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "I would like to talk about an analytical engine.",
  company: "",
};

/** Hex-encoded SHA-256 of a UTF-8 string — mirrors the client's payload hash. */
async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("validateContact", () => {
  it("passes a well-formed submission", () => {
    expect(validateContact(valid)).toEqual({});
  });

  it("flags a missing name, a bad email, and a too-short message", () => {
    const errors = validateContact({
      name: "  ",
      email: "not an email",
      message: "hi",
      company: "",
    });
    expect(errors.name).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.message).toBeTruthy();
  });

  it("mirrors the server's length caps", () => {
    expect(
      validateContact({
        ...valid,
        name: "x".repeat(CONTACT_LIMITS.nameMax + 1),
      }).name,
    ).toBeTruthy();
    expect(
      validateContact({
        ...valid,
        message: "x".repeat(CONTACT_LIMITS.messageMax + 1),
      }).message,
    ).toBeTruthy();
    // The caps themselves are the contract shared with
    // services/contact/src/submission.ts — assert the numbers, not just that
    // something was rejected, so a one-sided change shows up here.
    expect(CONTACT_LIMITS).toEqual({
      nameMax: 100,
      emailMax: 254,
      messageMin: 10,
      messageMax: 5000,
    });
  });
});

describe("submitContact", () => {
  it("POSTs trimmed JSON to /api/contact with the OAC payload-hash header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    const result = await submitContact(
      { ...valid, name: "  Ada Lovelace  " },
      controller.signal,
    );

    expect(result).toEqual({ ok: true });
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("fetch was not called");
    const [url, options] = call;
    expect(url).toBe("/api/contact");
    expect(options.method).toBe("POST");
    expect(options.headers["content-type"]).toBe("application/json");
    // OAC-for-Lambda contract: without this header CloudFront's SigV4 signature
    // omits the body hash and the Function URL rejects the request.
    expect(options.headers["x-amz-content-sha256"]).toBe(
      await sha256Hex(options.body),
    );
    expect(JSON.parse(options.body).name).toBe("Ada Lovelace");
    expect(options.signal).toBe(controller.signal);
  });

  it("returns the backend's failure verdict verbatim", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ ok: false, error: "Nope." }, 400)),
    );

    await expect(submitContact(valid)).resolves.toEqual({
      ok: false,
      error: "Nope.",
    });
  });

  it("throws when the response is not the { ok } contract (e.g. an edge error page)", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response("<html>403</html>", { status: 403 })),
    );

    await expect(submitContact(valid)).rejects.toThrow(/403/);
  });
});
