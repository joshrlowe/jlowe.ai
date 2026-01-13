import prisma from "../../../lib/prisma.js";
import { createApiHandler } from "../../../lib/utils/apiRouteHandler.js";
import {
  withAuth,
  getUserIdFromToken,
} from "../../../lib/utils/authMiddleware.js";
import { handleApiError } from "../../../lib/utils/apiErrorHandler.js";
import { mapProjectStatus } from "../../../lib/utils/projectStatusMapper.js";
import { logActivity } from "../../../lib/utils/activityLogger.js";
import { validateAdminProjectData } from "../../../lib/utils/projectValidators.js";
import { transformTeamToTeamMembers } from "../../../lib/utils/projectTransformer.js";
import { buildProjectQuery } from "../../../lib/utils/queryBuilders.js";
// buildOrderBy removed - not currently used

// Refactored: Extract Method - GET handler extracted with query builder
const handleGetRequest = async (req, res) => {
  try {
    const query = buildProjectQuery({
      where: {},
      orderBy: { updatedAt: "desc" },
      includeTeam: true,
    });

    const projects = await prisma.project.findMany({
      ...query,
      take: query.take || 100, // Add reasonable limit to prevent memory issues
    });
    res.json(projects);
  } catch (error) {
    handleApiError(error, res);
  }
};

// Refactored: Extract Method - POST handler extracted
const handlePostRequest = async (req, res, token) => {
  try {
    // Refactored: Extract Method - Validation extracted
    const validation = validateAdminProjectData(req.body);
    if (!validation.isValid) {
      return res
        .status(400)
        .json({ message: validation.message || "Title and slug are required" });
    }

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
      teamMembers,
    } = req.body;

    const userId = getUserIdFromToken(token);
    const mappedStatus = mapProjectStatus(status) || "Draft";

    // Refactored: Extract Method - Project creation data extracted
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

    // Refactored: Extract Method - Team member creation extracted
    if (Array.isArray(teamMembers) && teamMembers.length > 0) {
      await prisma.projectTeamMember.createMany({
        data: transformTeamToTeamMembers(teamMembers).map((member) => ({
          projectId: project.id,
          ...member,
        })),
      });
    }

    // Refactored: Extract Method - Activity logging extracted
    await logActivity({
      userId,
      entityType: "Project",
      entityId: project.id,
      projectId: project.id,
      action: "create",
      description: `Project "${project.title}" created`,
    });

    const createdProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: { teamMembers: true },
    });

    res.status(201).json(createdProject);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ message: "A project with this slug already exists" });
    }
    handleApiError(error, res);
  }
};

// Refactored: Extract Method - Auth middleware and method routing extracted
export default withAuth(
  createApiHandler({
    GET: handleGetRequest,
    POST: handlePostRequest,
  }),
);
