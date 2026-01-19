/**
 * Admin About API Handler
 *
 * PUT /api/admin/about - Update about page content
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
        professionalSummary,
        technicalSkills,
        professionalExperience,
        education,
        technicalCertifications,
        leadershipExperience,
        leadershipSubtitle,
        hobbies,
      } = req.body;

      // Validate required fields
      if (!professionalSummary || typeof professionalSummary !== "string") {
        return res.status(400).json({ message: "Professional summary is required" });
      }

      // Delete existing about record and create new one (upsert pattern)
      await prisma.about.deleteMany({});

      const about = await prisma.about.create({
        data: {
          professionalSummary,
          technicalSkills: technicalSkills || [],
          professionalExperience: professionalExperience || [],
          education: education || [],
          technicalCertifications: technicalCertifications || [],
          leadershipExperience: leadershipExperience || [],
          leadershipSubtitle: leadershipSubtitle || null,
          hobbies: hobbies || [],
        },
      });

      return res.status(200).json(about);
    } catch (error) {
      console.error("API Error:", error);
      return res.status(500).json({ message: "Failed to update about content" });
    }
  }

  // Method not allowed
  res.setHeader("Allow", ["PUT"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

