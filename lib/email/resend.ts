/**
 * Resend wrapper. Lazy-imports the SDK so the dependency is only loaded
 * when the funnel is configured. Fails open on missing config or send error.
 */

import { getConfig } from "@/lib/config";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const cfg = getConfig().funnel;
  if (!cfg) {
    console.warn("[email] funnel config missing; skipping send");
    return false;
  }
  try {
    const { Resend } = await import("resend");
    const client = new Resend(cfg.resendApiKey);
    const result = await client.emails.send({
      from: cfg.resendFromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    if (result.error) {
      console.warn("[email] send failed:", result.error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[email] send threw:", (err as Error).message);
    return false;
  }
}
