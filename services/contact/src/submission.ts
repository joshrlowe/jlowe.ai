import { z } from "zod";

/**
 * The contact-form request contract. Caps every field so a hostile client can
 * neither blow up the SES payload nor use the form as a bulk-mail relay, and
 * **fails closed**: anything that doesn't parse is a 400, never a "best effort"
 * send.
 *
 * `company` is the honeypot — a field no human ever sees (it renders off-screen,
 * `aria-hidden`, `tabIndex={-1}`). Naive form-filling bots populate every input
 * they find, so a non-empty value is a near-certain bot. It is validated
 * (bounded length) rather than ignored so a hostile client can't smuggle an
 * unbounded payload past the size caps by hiding it there.
 */
const SubmissionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(10).max(5000),
  company: z.string().max(200).optional(),
});

export type Submission = z.infer<typeof SubmissionSchema>;

/**
 * Parse + validate the request body. Throws on malformed/oversize input; the
 * handler maps that to a 400. Accepts the base64 form a Lambda Function URL
 * uses when it doesn't recognise the payload as text.
 */
export function parseSubmission(
  body: string | undefined,
  isBase64Encoded = false,
): Submission {
  const raw = isBase64Encoded
    ? Buffer.from(body ?? "", "base64").toString("utf8")
    : (body ?? "{}");
  return SubmissionSchema.parse(JSON.parse(raw || "{}"));
}

/** True when the honeypot was filled in — i.e. the sender is almost certainly a bot. */
export function isBot(submission: Submission): boolean {
  return (submission.company ?? "").trim().length > 0;
}

/**
 * Collapse anything that could break out of a single header line: C0/C1 control
 * characters (CR and LF above all) become spaces, and runs of whitespace fold to
 * one. SES v2's `Simple` content builds the MIME itself, so this is defence in
 * depth rather than the only guard — but a subject is still a header value and
 * control characters have no business in one.
 */
function headerSafe(value: string): string {
  return Array.from(value)
    .map((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      const isControl = code < 0x20 || (code >= 0x7f && code <= 0x9f);
      return isControl ? " " : ch;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export interface EmailContent {
  subject: string;
  text: string;
}

/**
 * Render the notification email the site owner receives. Plain text only — no
 * HTML part, so there is no markup a submitted string could escape into; the
 * reply-to (set by the handler) is what makes replying one click.
 */
export function buildEmail(submission: Submission): EmailContent {
  const name = headerSafe(submission.name);
  return {
    subject: `jlowe.ai contact — ${name}`,
    text: [
      `Name:  ${name}`,
      `Email: ${submission.email}`,
      "",
      submission.message,
    ].join("\n"),
  };
}
