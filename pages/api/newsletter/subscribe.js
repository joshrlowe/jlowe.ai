import prisma from "../../../lib/prisma.js";
import { handleApiError } from "../../../lib/utils/apiErrorHandler.js";

export default async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
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
    handleApiError(error, res);
  }
};
