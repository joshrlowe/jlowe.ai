import prisma from "../../../lib/prisma.js";
import { handleApiError } from "../../../lib/utils/apiErrorHandler.js";
import { withAuth } from "../../../lib/utils/authMiddleware.js";

// Default enabled sections for home page
const DEFAULT_ENABLED_SECTIONS = ["hero", "welcome", "projects", "stats", "articles"];

async function handler(req, res, _token) {
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
            enabledSections: DEFAULT_ENABLED_SECTIONS,
          },
        });
      }

      // Ensure enabledSections has a default value
      if (!settings.enabledSections) {
        settings.enabledSections = DEFAULT_ENABLED_SECTIONS;
      }

      res.json(settings);
    } catch (error) {
      handleApiError(error, res);
    }
  } else if (req.method === "PUT") {
    try {
      const { ownerName, siteName, navLinks, footerText, footerTitle, socials, seoDefaults, enabledSections } = req.body;

      let settings = await prisma.siteSettings.findFirst();

      const updateData = {
        ownerName,
        siteName,
        navLinks,
        footerText,
        footerTitle,
        socials,
        seoDefaults,
        enabledSections: Array.isArray(enabledSections) ? enabledSections : DEFAULT_ENABLED_SECTIONS,
      };

      if (!settings) {
        settings = await prisma.siteSettings.create({
          data: {
            ownerName: ownerName || "",
            siteName: siteName || "jlowe.ai",
            navLinks: navLinks || [],
            footerText: footerText || "",
            footerTitle: footerTitle || "",
            socials: socials || {},
            seoDefaults: seoDefaults || {},
            enabledSections: Array.isArray(enabledSections) ? enabledSections : DEFAULT_ENABLED_SECTIONS,
          },
        });
      } else {
        settings = await prisma.siteSettings.update({
          where: { id: settings.id },
          data: updateData,
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

export default withAuth(handler);
