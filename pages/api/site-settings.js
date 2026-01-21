/**
 * Public Site Settings API
 * 
 * GET-only endpoint for fetching site settings without authentication.
 * Used by components like Footer that need settings on every page.
 */

import prisma from "../../lib/prisma.js";
import { handleApiError } from "../../lib/utils/apiErrorHandler.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const settings = await prisma.siteSettings.findFirst({
      select: {
        ownerName: true,
        siteName: true,
        footerText: true,
        footerTitle: true,
        navLinks: true,
        socials: true,
        seoDefaults: true,
      },
    });

    if (!settings) {
      // Return defaults if no settings exist
      return res.json({
        ownerName: "",
        siteName: "jlowe.ai",
        footerText: "",
        footerTitle: "",
        navLinks: [],
        socials: {},
        seoDefaults: {},
      });
    }

    res.json(settings);
  } catch (error) {
    handleApiError(error, res);
  }
}

