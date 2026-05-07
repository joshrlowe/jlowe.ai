import type { NextApiRequest, NextApiResponse } from "next";
import type { JWT } from "next-auth/jwt";
import prisma from "../../../lib/prisma";
import { createApiHandler } from "../../../lib/utils/apiRouteHandler";
import {
  withAuth,
  getUserIdFromToken,
} from "../../../lib/utils/authMiddleware";
import { handleApiError } from "../../../lib/utils/apiErrorHandler";
import { mapProjectStatus } from "../../../lib/utils/projectStatusMapper";
import { logActivity } from "../../../lib/utils/activityLogger";
import { validateAdminProjectData } from "../../../lib/utils/projectValidators";
import { transformTeamToTeamMembers } from "../../../lib/utils/projectTransformer";
import { buildProjectQuery } from "../../../lib/utils/queryBuilders";
// buildOrderBy removed - not currently used

// Refactored: Extract Method - GET handler extracted with query builder
const handleGetRequest = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const query = buildProjectQuery({
      where: {},
      orderBy: { updatedAt: "desc" },
      includeTeam: true,
    });

    const projects = await prisma.project.findMany({
      ...query,
      take: (query.take as number) || 100, // Add reasonable limit to prevent memory issues
    } as Parameters<typeof prisma.project.findMany>[0]);
    res.json(projects);
  } catch (error) {
    handleApiError(error as Error, res);
  }
};

// Refactored: Extract Method - POST handler extracted
const handlePostRequest = async (
  req: NextApiRequest,
  res: NextApiResponse,
  ...args: unknown[]
) => {
  const token = args[0] as JWT;
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
      backgroundImage,
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
        backgroundImage: backgroundImage || null,
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
    if ((error as { code?: string }).code === "P2002") {
      return res
        .status(400)
        .json({ message: "A project with this slug already exists" });
    }
    handleApiError(error as Error, res);
  }
};

// Refactored: Extract Method - Auth middleware and method routing extracted
export default withAuth(
  createApiHandler({
    GET: handleGetRequest,
    POST: handlePostRequest,
  }),
);
