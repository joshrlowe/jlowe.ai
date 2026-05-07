import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { handleApiError } from "../../../lib/utils/apiErrorHandler";
import { checkRateLimit } from "../../../lib/utils/rateLimit";
import { validateEmail } from "../../../lib/utils/validators";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const allowed = await checkRateLimit(req, res, {
      maxRequests: 3,
      windowSeconds: 60,
      keyPrefix: "newsletter",
    });
    if (!allowed) return;

    const { email } = req.body as { email: string };

    const validation = validateEmail(email);
    if (!validation.isValid) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    // Check if already subscribed
    const existing = await prisma.newsletterSubscription.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      if (existing.active) {
        return res.status(400).json({ message: "Email already subscribed" });
      } else {
        // Reactivate subscription
        const subscription = await prisma.newsletterSubscription.update({
          where: { email: email.toLowerCase() },
          data: { active: true },
        });
        return res.json({ message: "Subscription reactivated", subscription });
      }
    }

    // Create new subscription
    const subscription = await prisma.newsletterSubscription.create({
      data: {
        email: email.toLowerCase(),
        active: true,
      },
    });

    res.status(201).json({ message: "Successfully subscribed", subscription });
  } catch (error) {
    handleApiError(error as Error, res);
  }
}
