import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { createApiHandler } from "../../../lib/utils/apiRouteHandler";
import { withAuth } from "../../../lib/utils/authMiddleware";
import { handleApiError } from "../../../lib/utils/apiErrorHandler";
import { removeUndefined } from "../../../lib/utils/apiHelpers";

// Refactored: Extract Method - GET handler extracted
const handleGetRequest = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { entityType, entityId, projectId, limit = 50, offset = 0 } = req.query;

    // Refactored: Extract Method - Where clause building extracted
    const where = removeUndefined({
      ...(entityType && { entityType: entityType as string }),
      ...(entityId && { entityId: entityId as string }),
      ...(projectId && { projectId: projectId as string }),
    });

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({ logs, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
  } catch (error) {
    handleApiError(error as Error, res);
  }
};

// Refactored: Extract Method - Auth middleware and method routing extracted
export default withAuth(
  createApiHandler({
    GET: handleGetRequest,
  })
);
