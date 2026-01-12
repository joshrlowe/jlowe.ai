import prisma from "../../../lib/prisma.js";
import { createApiHandler } from "../../../lib/utils/apiRouteHandler.js";
import { mapProjectStatus } from "../../../lib/utils/projectStatusMapper.js";
import {
  transformProjectsToApiFormat,
  transformProjectToApiFormat,
  transformTeamToTeamMembers,
} from "../../../lib/utils/projectTransformer.js";
import {
  validateProjectData,
  validateTeamMembers,
} from "../../../lib/utils/projectValidators.js";
import { handleApiError } from "../../../lib/utils/apiErrorHandler.js";

const PROJECTS_LIMIT = 100;

const handleGetRequest = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      take: PROJECTS_LIMIT,
      orderBy: { startDate: "desc" },
      include: { teamMembers: true },
    });

    const transformedProjects = transformProjectsToApiFormat(projects);
    res.json(transformedProjects);
  } catch (error) {
    handleApiError(error, res);
  }
};

const handlePostRequest = async (req, res) => {
  try {
    const {
      title,
      team,
      description,
      techStack,
      repositoryLink,
      startDate,
      releaseDate,
      status,
    } = req.body;

    const projectValidation = validateProjectData({ title, startDate });
    const teamValidation = validateTeamMembers(team);

    if (!projectValidation.isValid) {
      return res
        .status(400)
        .json({
          message: projectValidation.message || "Missing required fields",
        });
    }

    if (!teamValidation.isValid) {
      return res
        .status(400)
        .json({ message: teamValidation.message || "Invalid team data" });
    }

    const mappedStatus = mapProjectStatus(status);

    const savedProject = await prisma.project.create({
      data: {
        title,
        description: description || null,
        repositoryLink: repositoryLink || null,
        startDate: new Date(startDate),
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        status: mappedStatus,
        techStack: techStack || null,
        teamMembers: {
          create: transformTeamToTeamMembers(team),
        },
      },
      include: { teamMembers: true },
    });

    const transformedProject = transformProjectToApiFormat(savedProject);
    res.status(201).json(transformedProject);
  } catch (error) {
    handleApiError(error, res);
  }
};

export default createApiHandler({
  GET: handleGetRequest,
  POST: handlePostRequest,
});
