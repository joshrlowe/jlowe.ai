/**
 * Nightly digest cron. Vercel calls this on the schedule in vercel.json.
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}`. Vercel injects this
 * automatically when the env var is set.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import { sendEmail } from "@/lib/email/resend";
import { renderQualifiedLeadsDigest } from "@/lib/email/templates/qualified-leads";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  const cfg = getConfig().funnel;
  if (!cfg) {
    res.status(503).json({ error: "Funnel not configured" });
    return;
  }
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${cfg.cronSecret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const cutoff = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);
  const sessions = await prisma.chatSession.findMany({
    where: {
      qualified: true,
      emailedToOwner: false,
      createdAt: { gte: cutoff },
    },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (sessions.length === 0) {
    res.status(200).json({ sent: 0 });
    return;
  }

  const { subject, html, text } = renderQualifiedLeadsDigest(sessions);
  const ok = await sendEmail({
    to: cfg.ownerEmail,
    subject,
    html,
    text,
  });
  if (!ok) {
    res.status(502).json({ error: "Email send failed" });
    return;
  }

  await prisma.chatSession.updateMany({
    where: { id: { in: sessions.map((s) => s.id) } },
    data: { emailedToOwner: true },
  });

  res.status(200).json({ sent: sessions.length });
}
