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
      const { pageKey } = req.query;

      if (!pageKey) {
        return res.status(400).json({ message: "pageKey is required" });
      }

      let pageContent = await prisma.pageContent.findUnique({
        where: { pageKey },
      });

      // Return default structure if page doesn't exist
      if (!pageContent) {
        const defaults = getDefaultContent(pageKey);
        res.json({ pageKey, content: defaults });
      } else {
        res.json(pageContent);
      }
    } catch (error) {
      handleApiError(error, res);
    }
  } else if (req.method === "PUT") {
    try {
      const { pageKey, content } = req.body;

      if (!pageKey || !content) {
        return res.status(400).json({ message: "pageKey and content are required" });
      }

      const pageContent = await prisma.pageContent.upsert({
        where: { pageKey },
        update: { content },
        create: { pageKey, content },
      });

      res.json(pageContent);
    } catch (error) {
      handleApiError(error, res);
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}

function getDefaultContent(pageKey) {
  switch (pageKey) {
    case "home":
      return {
        hero: {
          headline: "",
          subheadline: "",
          ctaText: "",
          ctaHref: "",
          imageUrl: "",
        },
        highlights: [],
        featuredProjectSlugs: [],
      };
    case "about":
      return {
        bio: [],
        skills: [],
        resumeUrl: "",
      };
    case "contact":
      return {
        headline: "",
        body: "",
        email: "",
        phone: "",
        formRecipientEmail: "",
      };
    default:
      return {};
  }
}

