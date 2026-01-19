import prisma from "../../../../lib/prisma.js";
import { handleApiError } from "../../../../lib/utils/apiErrorHandler.js";
import { mapProjectStatus } from "../../../../lib/utils/projectStatusMapper.js";
import { withAuth } from "../../../../lib/utils/authMiddleware.js";

async function handler(req, res, _token) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { projects } = req.body;

    if (!Array.isArray(projects)) {
      return res.status(400).json({ message: "Projects must be an array" });
    }

    const results = {
      successful: [],
      failed: [],
    };

    for (const projectData of projects) {
      try {
        const {
          title,
          slug,
          shortDescription,
          longDescription,
          tags,
          techStack,
          links,
          images,
          featured,
          status,
          startDate,
          releaseDate,
          metaTitle,
          metaDescription,
          ogImage,
        } = projectData;

        if (!title || !slug) {
          results.failed.push({
            project: projectData,
            error: "Title and slug are required",
          });
          continue;
        }

        const mappedStatus = status ? mapProjectStatus(status) : "Draft";

        const project = await prisma.project.create({
          data: {
            title,
            slug,
            shortDescription: shortDescription || "",
            longDescription: longDescription || "",
            description: shortDescription || "", // Legacy field
            tags: tags || [],
            techStack: techStack || [],
            links: links || {},
            images: images || [],
            featured: featured || false,
            status: mappedStatus,
            startDate: startDate ? new Date(startDate) : new Date(),
            releaseDate: releaseDate ? new Date(releaseDate) : null,
            metaTitle: metaTitle || null,
            metaDescription: metaDescription || null,
            ogImage: ogImage || null,
          },
        });

        results.successful.push(project);
      } catch (error) {
        results.failed.push({
          project: projectData,
          error: error.message || "Unknown error",
        });
      }
    }

    res.json({
      message: `Imported ${results.successful.length} project(s), ${results.failed.length} failed`,
      results,
    });
  } catch (error) {
    handleApiError(error, res);
  }
}

export default withAuth(handler);
