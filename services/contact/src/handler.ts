import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

import { buildEmail, isBot, parseSubmission } from "./submission.js";

/**
 * Set by Terraform (modules/contact). Read at module scope so a
 * mis-provisioned function fails loudly on its first invoke rather than
 * silently sending from an empty address.
 */
const FROM_ADDRESS = process.env.CONTACT_FROM_ADDRESS ?? "";
const TO_ADDRESS = process.env.CONTACT_TO_ADDRESS ?? "";

const client = new SESv2Client({});

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
} as const;

type Body = { ok: true } | { ok: false; error: string };

function json(
  statusCode: number,
  body: Body,
): APIGatewayProxyStructuredResultV2 {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

/** One-line structured log; CloudWatch Insights can query these as JSON. */
function log(fields: Record<string, unknown>): void {
  console.error(JSON.stringify(fields));
}

/**
 * Contact-form backend: validate → send one plain-text notification to the site
 * owner via SES v2, reply-to the submitter. Buffered (not streaming) — it
 * returns a tiny JSON verdict, not tokens.
 *
 * Failure policy, deliberately split:
 *  - **Fails closed on validation.** Bad/oversize/missing fields are a 400 and
 *    nothing is sent. There is no lenient path.
 *  - **Fails safe on SES.** A throttle, an unverified identity, or an outage is
 *    logged as structured JSON and answered with a 502 plus a friendly line, so
 *    the visitor is told to use the mailto fallback instead of staring at a
 *    hung form. We never pretend a send succeeded.
 *  - **Silently 200s bots.** A filled honeypot returns the same success shape a
 *    human gets, with no email sent — telling a bot it was detected only helps
 *    it adapt.
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  let submission;
  try {
    submission = parseSubmission(event.body, event.isBase64Encoded);
  } catch (error) {
    log({ level: "warn", msg: "contact_invalid", error: String(error) });
    return json(400, {
      ok: false,
      error: "Please check the form — some details are missing or too long.",
    });
  }

  if (isBot(submission)) {
    log({ level: "info", msg: "contact_honeypot" });
    return json(200, { ok: true });
  }

  const { subject, text } = buildEmail(submission);
  try {
    await client.send(
      new SendEmailCommand({
        FromEmailAddress: FROM_ADDRESS,
        Destination: { ToAddresses: [TO_ADDRESS] },
        // Replying to the notification replies to the visitor, not to the
        // no-reply sending identity.
        ReplyToAddresses: [submission.email],
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: "UTF-8" },
            Body: { Text: { Data: text, Charset: "UTF-8" } },
          },
        },
      }),
    );
  } catch (error) {
    log({ level: "error", msg: "contact_send_failed", error: String(error) });
    return json(502, {
      ok: false,
      error:
        "Sorry — I could not send that just now. Please email me directly and I will get straight back to you.",
    });
  }

  return json(200, { ok: true });
};
