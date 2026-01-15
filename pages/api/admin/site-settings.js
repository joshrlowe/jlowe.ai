import { getToken } from "next-auth/jwt";
import prisma from "../../../lib/prisma.js";
import { handleApiError } from "../../../lib/utils/apiErrorHandler.js";

// Default enabled sections for home page
const DEFAULT_ENABLED_SECTIONS = ["hero", "welcome", "projects", "stats", "articles"];

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
        // Try with enabledSections first, fall back without it if column doesn't exist
        try {
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
        } catch (createError) {
          // If enabledSections column doesn't exist, create without it
          if (createError.code === 'P2022') {
            settings = await prisma.siteSettings.create({
              data: {
                siteName: "jlowe.ai",
                navLinks: [],
                footerText: "",
                socials: {},
                seoDefaults: {},
              },
            });
            settings.enabledSections = DEFAULT_ENABLED_SECTIONS;
          } else {
            throw createError;
          }
        }
      }

      // Ensure enabledSections has a default value
      if (!settings.enabledSections) {
        settings.enabledSections = DEFAULT_ENABLED_SECTIONS;
      }

      res.json(settings);
    } catch (error) {
      // Handle case where enabledSections column doesn't exist
      if (error.code === 'P2022' && error.message?.includes('enabledSections')) {
        try {
          let settings = await prisma.siteSettings.findFirst({
            select: {
              id: true,
              siteName: true,
              navLinks: true,
              footerText: true,
              socials: true,
              seoDefaults: true,
              createdAt: true,
              updatedAt: true,
            },
          });
          if (settings) {
            settings.enabledSections = DEFAULT_ENABLED_SECTIONS;
            return res.json(settings);
          }
        } catch (fallbackError) {
          console.error("Fallback query failed:", fallbackError);
        }
      }
      handleApiError(error, res);
    }
  } else if (req.method === "PUT") {
    try {
      const { siteName, navLinks, footerText, socials, seoDefaults, enabledSections } = req.body;

      let settings = await prisma.siteSettings.findFirst();

      // Build update data, conditionally including enabledSections
      const updateData = {
        siteName,
        navLinks,
        footerText,
        socials,
        seoDefaults,
      };

      // Try to include enabledSections if the column exists
      let supportsEnabledSections = true;

      if (!settings) {
        try {
          settings = await prisma.siteSettings.create({
            data: {
              ...updateData,
              siteName: siteName || "jlowe.ai",
              navLinks: navLinks || [],
              footerText: footerText || "",
              socials: socials || {},
              seoDefaults: seoDefaults || {},
              enabledSections: enabledSections || DEFAULT_ENABLED_SECTIONS,
            },
          });
        } catch (createError) {
          if (createError.code === 'P2022') {
            supportsEnabledSections = false;
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
            throw createError;
          }
        }
      } else {
        try {
          settings = await prisma.siteSettings.update({
            where: { id: settings.id },
            data: {
              ...updateData,
              enabledSections: enabledSections || DEFAULT_ENABLED_SECTIONS,
            },
          });
        } catch (updateError) {
          if (updateError.code === 'P2022') {
            supportsEnabledSections = false;
            settings = await prisma.siteSettings.update({
              where: { id: settings.id },
              data: updateData,
            });
          } else {
            throw updateError;
          }
        }
      }

      // Add enabledSections to response even if not in DB
      if (!supportsEnabledSections || !settings.enabledSections) {
        settings.enabledSections = enabledSections || DEFAULT_ENABLED_SECTIONS;
      }

      res.json(settings);
    } catch (error) {
      handleApiError(error, res);
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
