/**
 * Admin API endpoint for welcome data
 *
 * PUT - Update welcome data (name, briefBio, callToAction)
 */

import type { NextApiRequest, NextApiResponse } from "next";
import type { JWT } from "next-auth/jwt";
import prisma from "../../../lib/prisma";
import { handleApiError } from "../../../lib/utils/apiErrorHandler";
import { withAuth } from "../../../lib/utils/authMiddleware";
import { inngest } from "../../../lib/jobs/client";

async function handler(req: NextApiRequest, res: NextApiResponse, _token: JWT) {
  if (req.method === "PUT") {
    try {
      const { name, briefBio, callToAction } = req.body;

      if (!name || !briefBio) {
        return res.status(400).json({ message: "Name and briefBio are required" });
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

      try {
        await inngest.send({
          name: "content/welcome.upserted",
          data: {},
        });
      } catch (emitErr) {
        console.warn(
          "[welcome] failed to emit welcome.upserted event:",
          (emitErr as Error).message
        );
      }

      res.json(welcome);
    } catch (error) {
      handleApiError(error as Error, res);
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}

export default withAuth(handler);
