import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { createApiHandler } from "../../../lib/utils/apiRouteHandler";
import { transformProjectToApiFormat } from "../../../lib/utils/projectTransformer";
import { handleApiError } from "../../../lib/utils/apiErrorHandler";

const handleGetRequest = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const id = req.query.id as string;

    if (!id) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: { teamMembers: true },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const transformedProject = transformProjectToApiFormat(project);
    res.json(transformedProject);
  } catch (error) {
    handleApiError(error as Error, res);
  }
};

export default createApiHandler({
  GET: handleGetRequest,
});
