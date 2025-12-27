/**
 * Admin API endpoint for welcome data
 *
 * PUT - Update welcome data (name, briefBio, callToAction)
 */

import { getToken } from "next-auth/jwt";
import prisma from "../../../lib/prisma.js";
import { handleApiError } from "../../../lib/utils/apiErrorHandler.js";

export default async function handler(req, res) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "PUT") {
    try {
      const { name, briefBio, callToAction } = req.body;

      if (!name || !briefBio) {
        return res
          .status(400)
          .json({ message: "Name and briefBio are required" });
      }

      // Delete existing and create new (upsert pattern)
      await prisma.welcome.deleteMany({});

      const welcome = await prisma.welcome.create({
        data: {
          name,
          briefBio,
          callToAction: callToAction || null,
        },
      });

      res.json(welcome);
    } catch (error) {
      handleApiError(error, res);
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
