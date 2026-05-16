/**
 * Admin Project API - CRUD operations for single project
 *
 * Refactored following Martin Fowler's principles:
 * - Extract Function: Each handler is a separate function
 * - Build update data is extracted to helper
 * - Team member sync is extracted to helper
 */

import type { NextApiRequest, NextApiResponse } from "next";
import type { JWT } from "next-auth/jwt";
import prisma from "../../../../lib/prisma";
import { handleApiError } from "../../../../lib/utils/apiErrorHandler";
import { mapProjectStatus } from "../../../../lib/utils/projectStatusMapper";
import { logActivity } from "../../../../lib/utils/activityLogger";
import { withAuth, getUserIdFromToken } from "../../../../lib/utils/authMiddleware";
import { inngest } from "../../../../lib/jobs/client";

/**
 * Find project or return 404
 */
async function findProjectOrNull(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: { teamMembers: true },
  });
}

interface ProjectUpdateBody {
  title?: string;
  slug?: string;
  shortDescription?: string;
  longDescription?: string;
  tags?: string[];
  techStack?: string[];
  links?: Record<string, unknown>;
  images?: string[];
  backgroundImage?: string | null;
  featured?: boolean;
  status?: string;
  startDate?: string | null;
  releaseDate?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  teamMembers?: { name: string; email?: string | null }[];
}

/**
 * Build update data object from request body
 * Only includes fields that are explicitly provided
 */
function buildUpdateData(body: ProjectUpdateBody) {
  const {
    title,
    slug,
    shortDescription,
    longDescription,
    tags,
    techStack,
    links,
    images,
    backgroundImage,
    featured,
    status,
    startDate,
    releaseDate,
    metaTitle,
    metaDescription,
    ogImage,
  } = body;

  const updateData: Record<string, unknown> = {};

  if (title !== undefined) updateData.title = title;
  if (slug !== undefined) updateData.slug = slug;
  if (shortDescription !== undefined) {
    updateData.shortDescription = shortDescription;
    updateData.description = shortDescription; // Legacy field
  }
  if (longDescription !== undefined) updateData.longDescription = longDescription;
  if (tags !== undefined) updateData.tags = tags;
  if (techStack !== undefined) updateData.techStack = techStack;
  if (links !== undefined) updateData.links = links;
  if (images !== undefined) updateData.images = images;
  if (backgroundImage !== undefined) updateData.backgroundImage = backgroundImage || null;
  if (featured !== undefined) updateData.featured = featured;
  if (status !== undefined) {
    const mappedStatus = mapProjectStatus(status);
    if (mappedStatus !== undefined) updateData.status = mappedStatus;
  }
  if (startDate !== undefined) {
    updateData.startDate = startDate ? new Date(startDate) : new Date();
  }
  if (releaseDate !== undefined) {
    updateData.releaseDate = releaseDate ? new Date(releaseDate) : null;
  }
  if (metaTitle !== undefined) updateData.metaTitle = metaTitle || null;
  if (metaDescription !== undefined) updateData.metaDescription = metaDescription || null;
  if (ogImage !== undefined) updateData.ogImage = ogImage || null;

  return updateData;
}

/**
 * Sync team members - delete existing and create new
 */
async function syncTeamMembers(projectId: string, teamMembers?: { name: string; email?: string | null }[]) {
  if (teamMembers === undefined) return;

  // Delete existing team members
  await prisma.projectTeamMember.deleteMany({ where: { projectId } });

  // Create new team members
  if (Array.isArray(teamMembers) && teamMembers.length > 0) {
    await prisma.projectTeamMember.createMany({
      data: teamMembers.map((member) => ({
        projectId,
        name: member.name,
        email: member.email || null,
      })),
    });
  }
}

/**
 * GET /api/admin/projects/[id]
 */
async function handleGetRequest(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string;

  const project = await findProjectOrNull(id);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  res.json(project);
}

/**
 * PUT /api/admin/projects/[id]
 */
async function handlePutRequest(req: NextApiRequest, res: NextApiResponse, token: JWT) {
  const id = req.query.id as string;
  const userId = getUserIdFromToken(token);

  // Verify project exists
  const existingProject = await prisma.project.findUnique({ where: { id } });
  if (!existingProject) {
    return res.status(404).json({ message: "Project not found" });
  }

  // Build and apply update
  const updateData = buildUpdateData(req.body as ProjectUpdateBody);
  const project = await prisma.project.update({
    where: { id },
    data: updateData,
    include: { teamMembers: true },
  });

  // Sync team members if provided
  await syncTeamMembers(id, (req.body as ProjectUpdateBody).teamMembers);

  // Log activity
  await logActivity({
    userId,
    entityType: "Project",
    entityId: id,
    projectId: id,
    action: "update",
    description: `Project "${project.title}" updated`,
  });

  // Return fresh data
  const updatedProject = await findProjectOrNull(id);

  try {
    await inngest.send({
      name: "content/project.upserted",
      data: { projectId: id },
    });
  } catch (emitErr) {
    console.warn(
      "[projects/[id]] failed to emit project.upserted event:",
      (emitErr as Error).message,
    );
  }

  res.json(updatedProject);
}

/**
 * DELETE /api/admin/projects/[id]
 */
async function handleDeleteRequest(req: NextApiRequest, res: NextApiResponse, token: JWT) {
  const id = req.query.id as string;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  await prisma.project.delete({ where: { id } });

  // Log activity
  const userId = getUserIdFromToken(token);
  await logActivity({
    userId,
    entityType: "Project",
    entityId: id,
    projectId: id,
    action: "delete",
    description: `Project "${project.title}" deleted`,
  });

  try {
    await inngest.send({
      name: "content/project.deleted",
      data: { projectId: id },
    });
  } catch (emitErr) {
    console.warn(
      "[projects/[id]] failed to emit project.deleted event:",
      (emitErr as Error).message,
    );
  }

  res.json({ message: "Project deleted successfully" });
}

/**
 * Main handler with method routing
 */
async function handler(req: NextApiRequest, res: NextApiResponse, token: JWT) {
  try {
    switch (req.method) {
      case "GET":
        return await handleGetRequest(req, res);
      case "PUT":
        return await handlePutRequest(req, res, token);
      case "DELETE":
        return await handleDeleteRequest(req, res, token);
      default:
        return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return res.status(400).json({ message: "A project with this slug already exists" });
    }
    handleApiError(error as Error, res);
  }
}

export default withAuth(handler);
