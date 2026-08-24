// Client transport + validation for the contact form. The backend is a buffered
// Lambda behind a same-origin `/api/contact` CloudFront behavior (CSP
// `connect-src 'self'` already permits it), mirroring `components/chat/stream.ts`.
//
// The limits below are a deliberate duplicate of the zod schema in
// services/contact/src/submission.ts. The server is the authority — it re-checks
// everything and fails closed — but repeating the rules here is what lets the
// visitor see "this message is too long" without a round trip. Keep the two in
// step: the paired test asserts these numbers, so a drift shows up as a diff.

export interface ContactFields {
  name: string;
  email: string;
  message: string;
  /** Honeypot — always empty for a human. */
  company: string;
}

export type ContactField = "name" | "email" | "message";

export type ContactErrors = Partial<Record<ContactField, string>>;

export type ContactResult = { ok: true } | { ok: false; error: string };

export const CONTACT_LIMITS = {
  nameMax: 100,
  emailMax: 254,
  messageMin: 10,
  messageMax: 5000,
} as const;

/**
 * Pragmatic client-side email shape check: one @, something either side, a dot
 * in the domain, no whitespace. Deliberately looser than RFC 5322 — the server's
 * zod `.email()` is the real gate, and a client regex that is too clever mostly
 * succeeds at rejecting valid addresses.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Field-level validation, in the order the fields appear (first error wins focus). */
export function validateContact(fields: ContactFields): ContactErrors {
  const errors: ContactErrors = {};
  const name = fields.name.trim();
  const email = fields.email.trim();
  const message = fields.message.trim();

  if (name.length === 0) {
    errors.name = "Please enter your name.";
  } else if (name.length > CONTACT_LIMITS.nameMax) {
    errors.name = `Please keep your name under ${CONTACT_LIMITS.nameMax} characters.`;
  }

  if (email.length === 0) {
    errors.email = "Please enter your email address.";
  } else if (
    !EMAIL_PATTERN.test(email) ||
    email.length > CONTACT_LIMITS.emailMax
  ) {
    errors.email = "Please enter a valid email address.";
  }

  if (message.trim().length < CONTACT_LIMITS.messageMin) {
    errors.message = `Please write at least ${CONTACT_LIMITS.messageMin} characters so I know what you need.`;
  } else if (message.length > CONTACT_LIMITS.messageMax) {
    errors.message = `Please keep your message under ${CONTACT_LIMITS.messageMax} characters.`;
  }

  return errors;
}

/**
 * Hex-encoded SHA-256 of a UTF-8 string via the Web Crypto API. `/api/contact`
 * is a Lambda Function URL behind CloudFront Origin Access Control, and AWS's
 * OAC-for-Lambda contract requires the viewer to send the POST body's payload
 * hash in `x-amz-content-sha256` so CloudFront can fold it into the SigV4
 * signature it forwards. Without this header the origin rejects the request —
 * same requirement the chat client satisfies.
 */
async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * POST the submission and return the backend's verdict. A well-formed
 * `{ ok }` body is returned as-is (including the 400/502 failure shapes, whose
 * `error` is written to be shown to a visitor verbatim); anything else — an edge
 * error page, a network fault — throws, and the caller renders its generic
 * fallback.
 */
export async function submitContact(
  fields: ContactFields,
  signal?: AbortSignal,
): Promise<ContactResult> {
  const body = JSON.stringify({
    name: fields.name.trim(),
    email: fields.email.trim(),
    message: fields.message.trim(),
    company: fields.company,
  });
  const payloadHash = await sha256Hex(body);
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-amz-content-sha256": payloadHash,
    },
    body,
    signal,
  });

  const data: unknown = await res.json().catch(() => null);
  if (data && typeof data === "object" && "ok" in data) {
    const result = data as { ok: unknown; error?: unknown };
    if (result.ok === true) return { ok: true };
    if (result.ok === false && typeof result.error === "string") {
      return { ok: false, error: result.error };
    }
  }
  throw new Error(`contact request failed: ${res.status}`);
}
