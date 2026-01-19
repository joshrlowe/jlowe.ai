/**
 * Admin Project API - CRUD operations for single project
 *
 * Refactored following Martin Fowler's principles:
 * - Extract Function: Each handler is a separate function
 * - Build update data is extracted to helper
 * - Team member sync is extracted to helper
 */

import prisma from "../../../../lib/prisma.js";
import { handleApiError } from "../../../../lib/utils/apiErrorHandler.js";
import { mapProjectStatus } from "../../../../lib/utils/projectStatusMapper.js";
import { logActivity } from "../../../../lib/utils/activityLogger.js";
import { withAuth, getUserIdFromToken } from "../../../../lib/utils/authMiddleware.js";

/**
 * Find project or return 404
 */
async function findProjectOrNull(id) {
  return prisma.project.findUnique({
    where: { id },
    include: { teamMembers: true },
  });
}

/**
 * Build update data object from request body
 * Only includes fields that are explicitly provided
 */
function buildUpdateData(body) {
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

  const updateData = {};

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
async function syncTeamMembers(projectId, teamMembers) {
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
async function handleGetRequest(req, res) {
  const { id } = req.query;

  const project = await findProjectOrNull(id);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  res.json(project);
}

/**
 * PUT /api/admin/projects/[id]
 */
async function handlePutRequest(req, res, token) {
  const { id } = req.query;
  const userId = getUserIdFromToken(token);

  // Verify project exists
  const existingProject = await prisma.project.findUnique({ where: { id } });
  if (!existingProject) {
    return res.status(404).json({ message: "Project not found" });
  }

  // Build and apply update
  const updateData = buildUpdateData(req.body);
  const project = await prisma.project.update({
    where: { id },
    data: updateData,
    include: { teamMembers: true },
  });

  // Sync team members if provided
  await syncTeamMembers(id, req.body.teamMembers);

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
  res.json(updatedProject);
}

/**
 * DELETE /api/admin/projects/[id]
 */
async function handleDeleteRequest(req, res, token) {
  const { id } = req.query;

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

  res.json({ message: "Project deleted successfully" });
}

/**
 * Main handler with method routing
 */
async function handler(req, res, token) {
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
    if (error.code === "P2002") {
      return res.status(400).json({ message: "A project with this slug already exists" });
    }
    handleApiError(error, res);
  }
}

export default withAuth(handler);
