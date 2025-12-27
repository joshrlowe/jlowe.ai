import prisma from "../../../lib/prisma.js";
import {
  createApiHandler,
  createGetLatestHandler,
} from "../../../lib/utils/apiRouteHandler.js";
import { transformProjectToApiFormat } from "../../../lib/utils/projectTransformer.js";
import { handleApiError } from "../../../lib/utils/apiErrorHandler.js";

// Refactored: Extract Method - GET handler extracted
const handleGetRequest = async (req, res) => {
  try {
    const id = req.query.id;

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
    handleApiError(error, res);
  }
};

// Refactored: Extract Method - Method routing extracted to reusable handler
export default createApiHandler({
  GET: handleGetRequest,
});
