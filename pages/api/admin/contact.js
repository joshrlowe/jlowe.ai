/**
 * Admin Contact API Handler
 *
 * PUT /api/admin/contact - Update contact page content
 *
 * Protected route - requires authentication
 */

import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "../../../lib/prisma.js";

export default async function handler(req, res) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "PUT") {
    try {
      const {
        emailAddress,
        phoneNumber,
        address,
        availability,
        socialMediaLinks,
        heroWords,
      } = req.body;

      // Validate required fields
      if (!emailAddress || typeof emailAddress !== "string") {
        return res.status(400).json({ message: "Email address is required" });
      }

      // Delete existing contact record and create new one (upsert pattern)
      await prisma.contact.deleteMany({});

      const contact = await prisma.contact.create({
        data: {
          name: "Josh Lowe", // Default name
          emailAddress,
          phoneNumber: phoneNumber || null,
          location: address ? { address } : null,
          availability: availability || null,
          socialMediaLinks: socialMediaLinks || null,
          heroWords: heroWords || ["Amazing", "Innovative", "Momentous"],
        },
      });

      return res.status(200).json(contact);
    } catch (error) {
      console.error("API Error:", error);
      return res.status(500).json({ message: "Failed to update contact settings" });
    }
  }

  // Method not allowed
  res.setHeader("Allow", ["PUT"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

