import type { NextApiRequest, NextApiResponse } from "next";
import type { JWT } from "next-auth/jwt";
import prisma from "../../../../lib/prisma";
import { handleApiError } from "../../../../lib/utils/apiErrorHandler";
import { mapProjectStatus } from "../../../../lib/utils/projectStatusMapper";
import { logActivity } from "../../../../lib/utils/activityLogger";
import { withAuth, getUserIdFromToken } from "../../../../lib/utils/authMiddleware";
import { inngest } from "../../../../lib/jobs/client";

async function emitProjectEvents(
  name: "content/project.upserted" | "content/project.deleted",
  projectIds: string[],
): Promise<void> {
  const results = await Promise.allSettled(
    projectIds.map((projectId) =>
      inngest.send({ name, data: { projectId } }),
    ),
  );
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.warn(
      `[projects/bulk] ${failed.length}/${projectIds.length} ${name} emit(s) failed`,
    );
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse, token: JWT) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { action, projectIds, data } = req.body as {
      action: string;
      projectIds: string[];
      data?: { status?: string; featured?: boolean };
    };

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return res.status(400).json({ message: "No projects selected" });
    }

    const userId = getUserIdFromToken(token);

    switch (action) {
      case "delete":
        await prisma.project.deleteMany({
          where: { id: { in: projectIds } },
        });
        // Log activity for each project
        for (const projectId of projectIds) {
          await logActivity({
            userId,
            entityType: "Project",
            entityId: projectId,
            projectId,
            action: "delete",
            description: "Bulk deleted project",
          });
        }
        await emitProjectEvents("content/project.deleted", projectIds);
        return res.json({
          message: `${projectIds.length} project(s) deleted successfully`,
        });

      case "updateStatus": {
        if (!data?.status) {
          return res.status(400).json({ message: "Status is required" });
        }
        const mappedStatus = mapProjectStatus(data.status);
        await prisma.project.updateMany({
          where: { id: { in: projectIds } },
          data: { status: mappedStatus },
        });
        // Log activity for each project
        for (const projectId of projectIds) {
          await logActivity({
            userId,
            entityType: "Project",
            entityId: projectId,
            projectId,
            action: "status_change",
            field: "status",
            newValue: { value: data.status },
            description: `Bulk status changed to ${data.status}`,
          });
        }
        await emitProjectEvents("content/project.upserted", projectIds);
        return res.json({
          message: `${projectIds.length} project(s) updated successfully`,
        });
      }

      case "updateFeatured":
        if (data?.featured === undefined) {
          return res
            .status(400)
            .json({ message: "Featured value is required" });
        }
        await prisma.project.updateMany({
          where: { id: { in: projectIds } },
          data: { featured: data.featured },
        });
        // Log activity for each project
        for (const projectId of projectIds) {
          await logActivity({
            userId,
            entityType: "Project",
            entityId: projectId,
            projectId,
            action: "update",
            field: "featured",
            newValue: { value: data.featured },
            description: `Bulk featured set to ${data.featured}`,
          });
        }
        await emitProjectEvents("content/project.upserted", projectIds);
        return res.json({
          message: `${projectIds.length} project(s) updated successfully`,
        });

      default:
        return res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    handleApiError(error as Error, res);
  }
}

export default withAuth(handler);
