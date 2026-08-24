import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

import { runDigest } from "./digest.js";
import { DynamoSessionStore } from "./dynamo-store.js";

const FROM_ADDRESS = process.env.DIGEST_FROM_ADDRESS ?? "";
const TO_ADDRESS = process.env.DIGEST_TO_ADDRESS ?? "";
const TABLE = process.env.CHAT_SESSIONS_TABLE ?? "";

const ses = new SESv2Client({});

/**
 * EventBridge-scheduled digest. Buffered (not streaming). Throws on missing
 * config or SES failure so EventBridge retries; we only mark emailed after
 * a successful send.
 */
export async function handler(): Promise<{ sent: number }> {
  if (!FROM_ADDRESS || !TO_ADDRESS || !TABLE) {
    throw new Error(
      "digest misconfigured: DIGEST_FROM_ADDRESS, DIGEST_TO_ADDRESS, CHAT_SESSIONS_TABLE required",
    );
  }
  const store = new DynamoSessionStore(TABLE);
  const result = await runDigest({
    store,
    send: async (mail) => {
      await ses.send(
        new SendEmailCommand({
          FromEmailAddress: FROM_ADDRESS,
          Destination: { ToAddresses: [TO_ADDRESS] },
          Content: {
            Simple: {
              Subject: { Data: mail.subject, Charset: "UTF-8" },
              Body: {
                Text: { Data: mail.text, Charset: "UTF-8" },
                Html: { Data: mail.html, Charset: "UTF-8" },
              },
            },
          },
        }),
      );
    },
  });
  console.error(
    JSON.stringify({ level: "info", msg: "digest_sent", sent: result.sent }),
  );
  return { sent: result.sent };
}
