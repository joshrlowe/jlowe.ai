import prisma from "../../../lib/prisma.js";
import { createApiHandler } from "../../../lib/utils/apiRouteHandler.js";
import { withAuth } from "../../../lib/utils/authMiddleware.js";
import { handleApiError } from "../../../lib/utils/apiErrorHandler.js";
import { removeUndefined } from "../../../lib/utils/apiHelpers.js";

// Refactored: Extract Method - GET handler extracted
const handleGetRequest = async (req, res) => {
  try {
    const { entityType, entityId, projectId, limit = 50, offset = 0 } = req.query;

    // Refactored: Extract Method - Where clause building extracted
    const where = removeUndefined({
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(projectId && { projectId }),
    });

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({ logs, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    handleApiError(error, res);
  }
};

// Refactored: Extract Method - Auth middleware and method routing extracted
export default withAuth(
  createApiHandler({
    GET: handleGetRequest,
  })
);

