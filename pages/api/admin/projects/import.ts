import type { NextApiRequest, NextApiResponse } from "next";
import type { JWT } from "next-auth/jwt";
import prisma from "../../../../lib/prisma";
import type { Prisma } from "@prisma/client";
import { handleApiError } from "../../../../lib/utils/apiErrorHandler";
import { mapProjectStatus } from "../../../../lib/utils/projectStatusMapper";
import { withAuth } from "../../../../lib/utils/authMiddleware";
import { inngest } from "../../../../lib/jobs/client";

interface ImportProjectData {
  title?: string;
  slug?: string;
  shortDescription?: string;
  longDescription?: string;
  tags?: string[];
  techStack?: string[];
  links?: Record<string, unknown>;
  images?: string[];
  featured?: boolean;
  status?: string;
  startDate?: string;
  releaseDate?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse, _token: JWT) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { projects } = req.body as { projects: ImportProjectData[] };

    if (!Array.isArray(projects)) {
      return res.status(400).json({ message: "Projects must be an array" });
    }

    const results: {
      successful: unknown[];
      failed: { project: ImportProjectData; error: string }[];
    } = {
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
            links: (links || {}) as Prisma.InputJsonValue,
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

        try {
          await inngest.send({
            name: "content/project.upserted",
            data: { projectId: project.id },
          });
        } catch (emitErr) {
          console.warn(
            "[projects/import] failed to emit project.upserted event:",
            (emitErr as Error).message,
          );
        }

        results.successful.push(project);
      } catch (error) {
        results.failed.push({
          project: projectData,
          error: (error as Error).message || "Unknown error",
        });
      }
    }

    res.json({
      message: `Imported ${results.successful.length} project(s), ${results.failed.length} failed`,
      results,
    });
  } catch (error) {
    handleApiError(error as Error, res);
  }
}

export default withAuth(handler);
