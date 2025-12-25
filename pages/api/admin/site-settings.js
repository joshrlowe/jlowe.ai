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

  if (req.method === "GET") {
    try {
      let settings = await prisma.siteSettings.findFirst();

      if (!settings) {
        // Create default settings if none exist
        settings = await prisma.siteSettings.create({
          data: {
            siteName: "jlowe.ai",
            navLinks: [],
            footerText: "",
            socials: {},
            seoDefaults: {},
          },
        });
      }

      res.json(settings);
    } catch (error) {
      handleApiError(error, res);
    }
  } else if (req.method === "PUT") {
    try {
      const { siteName, navLinks, footerText, socials, seoDefaults } = req.body;

      let settings = await prisma.siteSettings.findFirst();

      if (!settings) {
        settings = await prisma.siteSettings.create({
          data: {
            siteName: siteName || "jlowe.ai",
            navLinks: navLinks || [],
            footerText: footerText || "",
            socials: socials || {},
            seoDefaults: seoDefaults || {},
          },
        });
      } else {
        settings = await prisma.siteSettings.update({
          where: { id: settings.id },
          data: {
            siteName,
            navLinks,
            footerText,
            socials,
            seoDefaults,
          },
        });
      }

      res.json(settings);
    } catch (error) {
      handleApiError(error, res);
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}

