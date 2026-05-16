import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { createApiHandler } from "../../../lib/utils/apiRouteHandler";
import { transformProjectsToApiFormat } from "../../../lib/utils/projectTransformer";
import { handleApiError } from "../../../lib/utils/apiErrorHandler";

const PROJECTS_LIMIT = 100;

const handleGetRequest = async (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    const projects = await prisma.project.findMany({
      take: PROJECTS_LIMIT,
      orderBy: { startDate: "desc" },
      include: { teamMembers: true },
    });

    const transformedProjects = transformProjectsToApiFormat(projects);
    res.json(transformedProjects);
  } catch (error) {
    handleApiError(error as Error, res);
  }
};

export default createApiHandler({
  GET: handleGetRequest,
});
